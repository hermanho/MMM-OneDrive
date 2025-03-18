/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { ICachePlugin } = require('@azure/msal-node');
const fs = require('fs');

/**
 * 
 * @param {string} CACHE_LOCATION 
 * @returns {ICachePlugin}
 */
const cachePlugin = (CACHE_LOCATION) => {
  const beforeCacheAccess = async (cacheContext) => {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(CACHE_LOCATION)) {
        fs.readFile(CACHE_LOCATION, "utf-8", (err, data) => {
          if (err) {
            reject();
          } else {
            cacheContext.tokenCache.deserialize(data);
            resolve();
          }
        });
      } else {
        fs.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
      }
    });
  };

  const afterCacheAccess = async (cacheContext) => {
    if (cacheContext.cacheHasChanged) {
      fs.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err) => {
        if (err) {
          console.log(err);
        }
      });
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

