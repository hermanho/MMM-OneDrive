import fs from "fs";
import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";

export const cachePlugin = (CACHE_LOCATION: string): ICachePlugin => {
  const beforeCacheAccess = async (cacheContext: TokenCacheContext) => {
    try {
      if (fs.existsSync(CACHE_LOCATION)) {
        const data = await fs.promises.readFile(CACHE_LOCATION, "utf-8");
        cacheContext.tokenCache.deserialize(data);
      } else {
        await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
      }
    } catch {
      // if cache file doesn't exists, create it
      await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
    }
  };

  const afterCacheAccess = async (cacheContext: TokenCacheContext) => {
    if (cacheContext.cacheHasChanged) {
      await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
    }
  };

  return {
    beforeCacheAccess,
    afterCacheAccess,
  };
};
