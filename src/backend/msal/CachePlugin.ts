import fs from "fs";
import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";

export const cachePlugin = (CACHE_LOCATION: string): ICachePlugin => {
  const beforeCacheAccess = async (cacheContext: TokenCacheContext) => {
    try {
      if (fs.existsSync(CACHE_LOCATION)) {
        console.debug("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file found, loading cache.");
        const data = await fs.promises.readFile(CACHE_LOCATION, "utf-8");
        cacheContext.tokenCache.deserialize(data);
      } else {
        console.info("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file not found, creating new cache file.");
        await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
      }
    } catch {
      console.warn("[MMM-OneDrive] [AuthProvider cachePlugin] Error reading cache file, creating new cache file.");
      // if cache file doesn't exists, create it
      await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
    }
  };

  const afterCacheAccess = async (cacheContext: TokenCacheContext) => {
    if (cacheContext.cacheHasChanged) {
      console.info("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file has changed, updating cache file.");
      await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
    }
  };

  return {
    beforeCacheAccess,
    afterCacheAccess,
  };
};
