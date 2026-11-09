import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionRequiredAuthError, ServerError, type AccountInfo, type AuthenticationResult } from "@azure/msal-node";
import AuthProvider from "./AuthProvider";
import sleep from "../functions/sleep";
import { createHash } from "node:crypto";

const fingerprint = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;

const msal = vi.hoisted(() => ({
  getAllAccounts: vi.fn(),
  serialize: vi.fn(),
  acquireTokenSilent: vi.fn(),
  acquireTokenByDeviceCode: vi.fn(),
}));

vi.mock("@azure/msal-node", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@azure/msal-node")>();
  return {
    ...actual,
    PublicClientApplication: class {
      getTokenCache() {
        return { getAllAccounts: msal.getAllAccounts, serialize: msal.serialize };
      }
      acquireTokenSilent = msal.acquireTokenSilent;
      acquireTokenByDeviceCode = msal.acquireTokenByDeviceCode;
    },
  };
});

vi.mock("../functions/sleep", () => ({
  default: vi.fn(() => Promise.resolve()),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const account: AccountInfo = {
  homeAccountId: "test-home-account",
  environment: "login.microsoftonline.com",
  tenantId: "test-tenant",
  username: "test@example.invalid",
  localAccountId: "test-local-account",
};
const token = { accessToken: "test-access-token", account } as AuthenticationResult;
const request = { scopes: ["User.Read", "Files.Read", "offline_access"] };

// Exercise the public getToken method; keep MSAL error classes real so instanceof
// checks use the same classes as production. No network or disk cache is involved.
describe("AuthProvider", () => {
  let provider: AuthProvider;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sleep).mockResolvedValue(undefined);
    for (const method of ["debug", "info", "warn", "error"] as const) {
      vi.spyOn(console, method).mockImplementation(() => {});
    }
    msal.getAllAccounts.mockResolvedValue([account]);
    msal.serialize.mockReturnValue("{}");
    msal.acquireTokenSilent.mockResolvedValue(token);
    msal.acquireTokenByDeviceCode.mockResolvedValue(token);
    provider = new AuthProvider({ auth: { clientId: "test-client" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("concurrent authentication — issue #50", () => {
    it.each(["no cached account", "rejected refresh token"])(
      "shares one device-code flow when there is %s",
      async (scenario) => {
        if (scenario === "no cached account") {
          msal.getAllAccounts.mockResolvedValue([]);
        } else {
          msal.acquireTokenSilent.mockRejectedValue(
            new InteractionRequiredAuthError("invalid_grant", "Grant expired", "bad_token"),
          );
        }

        const deviceCodeStarted = deferred<void>();
        const deviceCodeResult = deferred<AuthenticationResult>();
        msal.acquireTokenByDeviceCode.mockImplementation(() => {
          deviceCodeStarted.resolve(undefined);
          return deviceCodeResult.promise;
        });

        // Both callers arrive while interactive authentication is still pending.
        const first = provider.getToken(request, vi.fn());
        const second = provider.getToken(request, vi.fn());
        await deviceCodeStarted.promise;
        deviceCodeResult.resolve(token);
        const results = await Promise.all([first, second]);

        expect(results).toEqual([token, token]);
        expect(msal.acquireTokenByDeviceCode).toHaveBeenCalledTimes(1);
        expect(provider.account).toEqual(account);
      },
    );

    it("clears the shared request after success so later calls check MSAL again", async () => {
      expect(await provider.getToken(request, vi.fn())).toBe(token);
      const renewedToken = { ...token, accessToken: "renewed-access-token" };
      msal.acquireTokenSilent.mockResolvedValueOnce(renewedToken);

      expect(await provider.getToken(request, vi.fn())).toBe(renewedToken);
      expect(msal.acquireTokenSilent).toHaveBeenCalledTimes(2);
      expect(msal.acquireTokenByDeviceCode).not.toHaveBeenCalled();
    });

    it("shares sign-in failure and allows a fresh attempt afterward", async () => {
      msal.getAllAccounts.mockResolvedValue([]);
      const error = new Error("Device code expired");
      msal.acquireTokenByDeviceCode.mockRejectedValueOnce(error);

      const results = await Promise.allSettled([
        provider.getToken(request, vi.fn()),
        provider.getToken(request, vi.fn()),
      ]);

      expect(results).toEqual([
        { status: "rejected", reason: error },
        { status: "rejected", reason: error },
      ]);
      expect(msal.acquireTokenByDeviceCode).toHaveBeenCalledTimes(1);

      expect(await provider.getToken(request, vi.fn())).toBe(token);
      expect(msal.acquireTokenByDeviceCode).toHaveBeenCalledTimes(2);
      expect(provider.account).toEqual(account);
    });
  });

  describe("terminal silent-auth errors", () => {
    it.each([
      ["InteractionRequiredAuthError", () => new InteractionRequiredAuthError("invalid_grant", "Grant expired", "bad_token")],
      ["ServerError invalid_grant", () => new ServerError("invalid_grant", "Grant expired")],
    ] as const)("does not retry %s before device-code sign-in", async (_name, createError) => {
      msal.acquireTokenSilent.mockRejectedValue(createError());

      const result = await provider.getToken(request, vi.fn());

      expect(result).toBe(token);
      expect(msal.acquireTokenByDeviceCode).toHaveBeenCalledTimes(1);
      expect(msal.acquireTokenSilent).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    });
  });

  it("appends the cached refresh-token fingerprint to device-code completion", async () => {
    msal.getAllAccounts.mockResolvedValue([]);
    const refreshToken = "private-device-refresh-token";
    msal.acquireTokenByDeviceCode.mockImplementationOnce(() => {
      msal.serialize.mockReturnValue(JSON.stringify({ RefreshToken: { entry: { secret: refreshToken } } }));
      return Promise.resolve(token);
    });

    expect(await provider.getToken(request, vi.fn())).toBe(token);
    expect(console.info).toHaveBeenCalledWith("[MMM-OneDrive] [AuthProvider]", `getTokenDeviceCode done, refresh_token_hex: ${fingerprint(refreshToken)}`);
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(refreshToken);
  });

  it("does not fail successful device-code sign-in when fingerprint lookup fails", async () => {
    msal.getAllAccounts.mockResolvedValue([]);
    msal.serialize.mockImplementation(() => { throw new Error("Cache unavailable"); });

    expect(await provider.getToken(request, vi.fn())).toBe(token);
    expect(console.info).toHaveBeenCalledWith("[MMM-OneDrive] [AuthProvider]", "getTokenDeviceCode done, refresh_token_hex: unavailable");
  });

  it("returns a cached access token without starting device-code sign-in", async () => {
    const result = await provider.getToken(request, vi.fn());

    expect(result).toBe(token);
    expect(msal.acquireTokenSilent).toHaveBeenCalledExactlyOnceWith({ ...request, account });
    expect(msal.acquireTokenByDeviceCode).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });

  it("still retries a transient server error and succeeds silently", async () => {
    msal.acquireTokenSilent
      .mockRejectedValueOnce(new ServerError("temporarily_unavailable", "Try again"))
      .mockResolvedValueOnce(token);

    const result = await provider.getToken(request, vi.fn());

    expect(result).toBe(token);
    expect(msal.acquireTokenSilent).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledExactlyOnceWith(2000);
    expect(msal.acquireTokenByDeviceCode).not.toHaveBeenCalled();
  });
});
