/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const fs = require("fs");

/**
 * 
 * @param {string} CACHE_LOCATION 
 * @returns {import("@azure/msal-node").ICachePlugin}
 */
const cachePlugin = (CACHE_LOCATION) => {
  const beforeCacheAccess = async (cacheContext) => {
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

  const afterCacheAccess = async (cacheContext) => {
    if (cacheContext.cacheHasChanged) {
      await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
    }
  };

  return {
    beforeCacheAccess,
    afterCacheAccess,
  };
};

module.exports = {
  cachePlugin,
};

