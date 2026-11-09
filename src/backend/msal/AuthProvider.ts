import { PublicClientApplication, InteractionRequiredAuthError, ServerError, ClientAuthError, AuthenticationResult, AccountInfo, SilentFlowRequest, DeviceCodeRequest, Configuration } from "@azure/msal-node";
import { DeviceCodeResponse } from "@azure/msal-common";
import sleep from "../functions/sleep";
import { refreshTokenLogSuffix } from "./CachePlugin";

class AuthProvider {
  clientApplication: PublicClientApplication;
  account: AccountInfo | undefined;
  private pendingTokenRequest: Promise<AuthenticationResult | null> | undefined;

  constructor(msalConfig: Configuration) {
    /**
     * Initialize a public client application. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
     */
    this.clientApplication = new PublicClientApplication(msalConfig);

    this.account = undefined;
  }

  logDebug(...args) {
    console.debug("[MMM-OneDrive] [AuthProvider]", ...args);
  }

  logInfo(...args) {
    console.info("[MMM-OneDrive] [AuthProvider]", ...args);
  }

  logError(...args) {
    console.error("[MMM-OneDrive] [AuthProvider]", ...args);
  }

  logWarn(...args) {
    console.warn("[MMM-OneDrive] [AuthProvider]", ...args);
  }


  async logout() {
    if (!this.account) return;

    const cache = this.clientApplication.getTokenCache();
    try {
      await cache.removeAccount(this.account);
      this.account = undefined;
    } catch (error) {
      this.account = undefined;
      this.logError("Failed to clear token cache.", error);
    }
  }

  async getToken(request: Omit<SilentFlowRequest, "account">, deviceCodeCallback: ((response: DeviceCodeResponse) => void)) {
    // Album scans and image URL refreshes can request authentication together.
    // Share the entire operation, including interactive sign-in, not just MSAL's
    // silent request. Only the initiating caller presents the device code.
    if (this.pendingTokenRequest) {
      return this.pendingTokenRequest;
    }

    this.pendingTokenRequest = this.acquireToken(request, deviceCodeCallback);
    try {
      return await this.pendingTokenRequest;
    } finally {
      // Do not retain a completed token or a rejected sign-in promise.
      this.pendingTokenRequest = undefined;
    }
  }

  private async acquireToken(request: Omit<SilentFlowRequest, "account">, deviceCodeCallback: ((response: DeviceCodeResponse) => void)) {
    let authResponse: AuthenticationResult | null = null;
    const account = this.account || (await this.getAccount());

    if (account) {
      const tokenRequest = {
        ...request,
        account: account,
      };
      authResponse = await this.getTokenSilent(tokenRequest);
    }

    if (!authResponse) {
      this.logWarn("Failed to call getTokenSilent");

      try {
        authResponse = await this.getTokenDeviceCode(request, deviceCodeCallback);
      } catch (error) {
        this.logError("Failed to getTokenDeviceCode. ", error);
        throw error;
      }
    }

    if (authResponse && authResponse.account) {
      this.account = authResponse.account;
      this.logInfo("getToken done");
    } else {
      this.logError("Failed to acquire token, no authResponse returned.");
    }

    return authResponse;
  }

  private async getTokenSilent(tokenRequest: SilentFlowRequest, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await this.clientApplication.acquireTokenSilent({
          ...tokenRequest,
        });
      } catch (error) {
        this.logError(error);
        if (error instanceof InteractionRequiredAuthError ||
          (error instanceof ServerError && error.errorCode === "invalid_grant")) {
          this.logError("Silent token acquisition requires sign-in; skipping retries");
          return null;
        }
        if (error instanceof ClientAuthError && error.errorCode === "network_error") {
          this.logWarn("Network error occurred, waiting 60 seconds before retrying...");
          await sleep(60000);
        }
        attempt++;
        this.logWarn(`getTokenSilent failed, attempt ${attempt}/${maxRetries}.`);
        await sleep(2000);
      }
    }
    return null;
  }

  getRefreshTokenLogSuffix(): string {
    try {
      return refreshTokenLogSuffix(this.clientApplication.getTokenCache().serialize());
    } catch {
      // Fingerprint logging must never turn a successful sign-in into a failure.
      return " refresh_token_hex: unavailable";
    }
  }

  private async getTokenDeviceCode(tokenRequest: Omit<DeviceCodeRequest, "deviceCodeCallback">, callback: ((response: DeviceCodeResponse) => void) | null = null) {
    const deviceCodeRequest: DeviceCodeRequest = {
      ...tokenRequest,
      deviceCodeCallback: (response) => {
        this.logInfo(response.message);
        if (callback) {
          callback(response);
        }
      },
    };
    this.logInfo("Requesting a token using OAuth2.0 device code flow");
    const authResponse = await this.clientApplication
      .acquireTokenByDeviceCode(deviceCodeRequest);
    if (authResponse?.account) {
      this.account = authResponse.account;
    }
    this.logInfo("getTokenDeviceCode done," + this.getRefreshTokenLogSuffix());
    return authResponse;
  }

  /**
   * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
   */
  async getAccount() {
    try {
      const cache = this.clientApplication.getTokenCache();
      const currentAccounts = await cache.getAllAccounts();

      if (!currentAccounts) {
        this.logError("No accounts detected");
        return null;
      }

      if (currentAccounts.length > 1) {
        // Add choose account code here
        console.log("Multiple accounts detected, need to add choose account code.");
        return currentAccounts[0];
      } else if (currentAccounts.length === 1) {
        return currentAccounts[0];
      } else {
        return null;
      }
    } catch (error) {
      this.logError("Error getting account:", error);
      return null;
    }
  }
}

export default AuthProvider;
