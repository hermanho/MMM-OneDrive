const { LogLevel } = require("@azure/msal-node");
const path = require("path");
const { cachePlugin } = require("./CachePlugin");

const AAD_ENDPOINT_HOST = "https://login.microsoftonline.com/"; // include the trailing slash

const cachePath = path.resolve(__dirname, "./token.json");

const msalConfig = {
  auth: {
    clientId: "f1ffa820-44a2-43da-9016-d3302c89c36a",
    authority: `${AAD_ENDPOINT_HOST}/consumers`,
  },
  cache: {
    cachePlugin: cachePlugin(cachePath),
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, _containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Error,
    },
  },
};

const GRAPH_ENDPOINT_HOST = "https://graph.microsoft.com/"; // include the trailing slash

const protectedResources = {
  graphMe: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/me`,
    scopes: ["User.Read", "Files.Read", "offline_access"],
    // scopes: ["User.Read"],
  },
  listAllAlbums: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/me/drive/bundles?filter=${encodeURIComponent("bundle/album ne null")}`,
  },
  getChildrenInAlbum: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/me/drives/$$userId$$/items/$$albumId$$/children?$top=1000`,
  },
  getItem: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/drives/$$userId$$/items/$$itemId$$`,
  },
  getThumbnail: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/drive/items/$$itemId$$/thumbnails`,
  },
  $batch: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/$batch`,
  },
};

const getRelativeResourceUrl = (url) => {
  return url.replace(`${GRAPH_ENDPOINT_HOST}v1.0`, "");
};

module.exports = {
  msalConfig: msalConfig,
  cachePath: cachePath,
  protectedResources: protectedResources,
  getRelativeResourceUrl: getRelativeResourceUrl,
};
