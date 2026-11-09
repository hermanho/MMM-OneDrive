import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TokenCacheContext } from "@azure/msal-node";
import { cachePlugin, refreshTokenLogSuffix } from "./CachePlugin";
import { createHash } from "node:crypto";

const fingerprint = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;

const oldToken = "private-old-refresh-token";
const newToken = "private-new-refresh-token";
const key = "private-account-client-cache-key";
const serialized = (secret: string) => JSON.stringify({ RefreshToken: { [key]: { secret } } });

function context(data: string, changed = false) {
  return {
    cacheHasChanged: changed,
    tokenCache: { serialize: vi.fn(() => data), deserialize: vi.fn() },
  } as unknown as TokenCacheContext;
}

describe("CachePlugin refresh-token diagnostics", () => {
  let directory: string;
  let path: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "onedrive-auth-test-"));
    path = join(directory, "token.json");
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await writeFile(path, serialized(oldToken));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  it("verifies B replaced A on disk and a fresh plugin reloads B", async () => {
    const plugin = cachePlugin(path);
    await plugin.beforeCacheAccess(context(serialized(oldToken)));
    await plugin.afterCacheAccess(context(serialized(newToken), true));

    const saved = await readFile(path, "utf-8");
    expect(saved).toBe(serialized(newToken));
    const reloaded = context("{}");
    await cachePlugin(path).beforeCacheAccess(reloaded);
    expect(reloaded.tokenCache.deserialize).toHaveBeenCalledWith(serialized(newToken));

    expect(console.info).toHaveBeenCalledExactlyOnceWith(
      `[MMM-OneDrive] [AuthProvider cachePlugin] Cache file updated. refresh_token_hex: ${fingerprint(newToken)}`,
    );
    expect(console.debug).toHaveBeenNthCalledWith(1,
      `[MMM-OneDrive] [AuthProvider cachePlugin] Cache file found, loading cache. refresh_token_hex: ${fingerprint(oldToken)}`,
    );
    expect(console.debug).toHaveBeenNthCalledWith(2,
      `[MMM-OneDrive] [AuthProvider cachePlugin] Cache file found, loading cache. refresh_token_hex: ${fingerprint(newToken)}`,
    );
    const logs = JSON.stringify([...vi.mocked(console.info).mock.calls, ...vi.mocked(console.debug).mock.calls]);
    for (const secret of [oldToken, newToken, key]) expect(logs).not.toContain(secret);
  });

  it("propagates write failure and never claims a successful write", async () => {
    const plugin = cachePlugin(path);
    await plugin.beforeCacheAccess(context(serialized(oldToken)));
    const failure = new Error("Disk full");
    vi.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(failure);
    await expect(plugin.afterCacheAccess(context(serialized(newToken), true))).rejects.toBe(failure);
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("Cache file updated");
  });

  it("does not perform additional diagnostic disk reads after writing", async () => {
    const plugin = cachePlugin(path);
    const readSpy = vi.spyOn(fs.promises, "readFile");
    await plugin.afterCacheAccess(context(serialized(newToken), true));
    expect(readSpy).not.toHaveBeenCalled();
  });

  it("appends fingerprints to existing cache logs by default", async () => {
    const plugin = cachePlugin(path);
    await plugin.beforeCacheAccess(context(serialized(oldToken)));
    await plugin.afterCacheAccess(context(serialized(newToken), true));
    expect(await readFile(path, "utf-8")).toBe(serialized(newToken));
    expect(JSON.stringify([...vi.mocked(console.info).mock.calls, ...vi.mocked(console.debug).mock.calls])).toContain("refresh_token_hex:");
  });

  it("formats distinct fingerprints without exposing cache keys or raw tokens", () => {
    const cache = JSON.stringify({ RefreshToken: {
      privateKey: { secret: oldToken },
      duplicate: { secret: oldToken },
      anotherKey: { secret: newToken },
    } });
    expect(refreshTokenLogSuffix(cache)).toBe(` refresh_token_hex: ${fingerprint(oldToken)}, ${fingerprint(newToken)}`);
  });

  it("handles absent or malformed cache data without leaking contents", () => {
    expect(refreshTokenLogSuffix("{}")).toBe(" refresh_token_hex: none");
    expect(refreshTokenLogSuffix(oldToken)).toBe(" refresh_token_hex: unavailable");
  });

  it("does not write or claim verification when MSAL reports no changes", async () => {
    await cachePlugin(path).afterCacheAccess(context(serialized(newToken)));
    expect(await readFile(path, "utf-8")).toBe(serialized(oldToken));
    expect(console.info).not.toHaveBeenCalled();
  });
});
