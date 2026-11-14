import fs from "node:fs";
import { createHash } from "node:crypto";
import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";

export function refreshTokenLogSuffix(serialized: string): string {
  try {
    const cache = JSON.parse(serialized) as { RefreshToken?: Record<string, { secret?: unknown }> };
    const tokens = Object.values(cache.RefreshToken ?? {})
      .filter((entry) => typeof entry?.secret === "string" && entry.secret)
      .map((entry) => `sha256:${createHash("sha256").update(entry.secret as string).digest("hex").slice(0, 16)}`);
    return ` refresh_token_hex: ${[...new Set(tokens)].join(", ") || "none"}`;
  } catch {
    // Logging must not affect cache persistence or expose malformed contents.
    return " refresh_token_hex: unavailable";
  }
}

export const cachePlugin = (CACHE_LOCATION: string): ICachePlugin => {
  const beforeCacheAccess = async (cacheContext: TokenCacheContext) => {
    try {
      if (fs.existsSync(CACHE_LOCATION)) {
        const data = await fs.promises.readFile(CACHE_LOCATION, "utf-8");
        cacheContext.tokenCache.deserialize(data);
        console.debug("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file found, loading cache." + refreshTokenLogSuffix(data));
      } else {
        const serialized = cacheContext.tokenCache.serialize();
        await fs.promises.writeFile(CACHE_LOCATION, serialized);
        console.info("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file not found, created new cache file." + refreshTokenLogSuffix(serialized));
      }
    } catch {
      const serialized = cacheContext.tokenCache.serialize();
      await fs.promises.writeFile(CACHE_LOCATION, serialized);
      console.warn("[MMM-OneDrive] [AuthProvider cachePlugin] Error reading cache file, created new cache file." + refreshTokenLogSuffix(serialized));
    }
  };

  const afterCacheAccess = async (cacheContext: TokenCacheContext) => {
    if (cacheContext.cacheHasChanged) {
      const serialized = cacheContext.tokenCache.serialize();
      await fs.promises.writeFile(CACHE_LOCATION, serialized);
      console.info("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file updated." + refreshTokenLogSuffix(serialized));
    }
  };

  return {
    beforeCacheAccess,
    afterCacheAccess,
  };
};
