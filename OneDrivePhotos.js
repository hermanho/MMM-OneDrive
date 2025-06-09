"use strict";

const EventEmitter = require("events");
const crypto = require("crypto");
const { Client } = require('@microsoft/microsoft-graph-client');
const { LogLevel } = require("@azure/msal-node");
const ExifReader = require('exifreader');
const Log = require("logger");
const { error_to_string } = require("./error_to_string");
const { msalConfig, protectedResources } = require("./msal/authConfig");
const AuthProvider = require("./msal/AuthProvider");
const sleep = require("./sleep");

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

class Auth extends EventEmitter {
  #debug = {};
  /** @type {AuthProvider} */
  #authProvider = null;

  constructor(debug = false) {
    super();
    this.#debug = debug;
    this.init().then(() =>
      process.nextTick(() =>
        this.emit("ready")
      ),
      (err) =>
        this.emit("error", err)
    );
  }

  async init() {
    if (this.#debug) {
      msalConfig.system.loggerOptions.logLevel = LogLevel.Trace;
    }
    this.#authProvider = new AuthProvider(msalConfig);
    Log.info("[ONEDRIVE:CORE] Auth -> AuthProvider created");
  }

  get AuthProvider() { return this.#authProvider; }
}

class OneDrivePhotos extends EventEmitter {
  /** @type {Client} */
  #graphClient = null;
  /** @type {string} */
  #userId = null;
  #debug = false;

  constructor(options) {
    super();
    this.options = options;
    this.#debug = options.debug ? options.debug : this.debug;
    this.config = options.config;
  }

  log(...args) {
    Log.info("[ONEDRIVE:CORE]", ...args);
  }

  logError(...args) {
    Log.error("[ONEDRIVE:CORE]", ...args);
  }

  logDebug(...args) {
    Log.debug("[ONEDRIVE:CORE]", ...args);
  }

  /**
   * 
   * @param {import("@azure/msal-common").DeviceCodeResponse} response
   */
  deviceCodeCallback(response) {
    const expireDt = new Date(Date.now() + response.expiresIn * 1000);
    const message = response.message + `\nToken will be expired at ${expireDt.toLocaleTimeString(undefined, { hour12: true })}.`;
    this.emit("errorMessage", message);
  }

  async onAuthReady() {
    const auth = new Auth(this.#debug);
    return new Promise((resolve, reject) => {
      auth.on("ready", async () => {
        this.log("onAuthReady ready");
        const authProvider = auth.AuthProvider;
        const tokenRequest = {
          scopes: protectedResources.graphMe.scopes,
          correlationId: crypto.randomUUID(),
        };
        try {
          const tokenResponse = await authProvider.getToken(tokenRequest, this.config.forceAuthInteractive, (r) => this.deviceCodeCallback(r), (message) => this.emit("errorMessage", message));
          // this.log("onAuthReady token responded");
          this.emit("authSuccess");
          this.#graphClient = Client.init({
            authProvider: (done) => {
              done(null, tokenResponse.accessToken);
            },
          });
          const graphResponse = await this.#graphClient.api(protectedResources.graphMe.endpoint).get();
          this.#userId = graphResponse.id;
          this.log("onAuthReady done");
          resolve();
        } catch (err) {
          this.logError("onAuthReady error", err);
          reject(err);
        }
      });
      auth.on("error", (error) => {
        reject(error);
      });
    });
  }

  async request(logContext, url, method = "get", data = null) {
    this.logDebug((logContext ? `[${logContext}]` : '') + ` request ${method} URL: ${url}`);
    try {
      const ret = await this.#graphClient.api(url)[method](data);
      return ret;
    } catch (error) {
      this.logError((logContext ? `[${logContext}]` : '') + ` request fail ${method} URL: ${url}`);
      this.logError((logContext ? `[${logContext}]` : '') + " data: ", JSON.stringify(data));
      this.logError(error_to_string(error));
      throw error;
    }
  }

  async getAlbums() {
    const albums = await this.getAlbumLoop();
    albums.forEach(item => {
      item.title = item.name;
    });
    return albums;
  }

  async getAlbumLoop() {
    await this.onAuthReady();
    let url = protectedResources.listAllAlbums.endpoint.replace("$$userId$$", this.#userId);
    /** @type {microsoftgraph.DriveItem[]} */
    let list = [];
    let found = 0;
    /**
     * 
     * @param {string} pageUrl 
     * @returns {Promise<microsoftgraph.DriveItem[]>} DriveItem
     */
    const getAlbum = async (pageUrl) => {
      this.log("Getting Album info chunks.");
      try {
        /** @type {import("@microsoft/microsoft-graph-client").PageCollection} */
        let response = await this.request('getAlbum', pageUrl, "get", null);
        if (Array.isArray(response.value)) {
          /** @type {microsoftgraph.DriveItem[]} */
          const arrayValue = response.value;
          this.logDebug("found album:");
          this.logDebug("name\t\tid");
          arrayValue.map(a => `${a.name}\t${a.id}`).forEach(s => this.logDebug(s));
          found += arrayValue.length;
          list = list.concat(arrayValue);
        }
        if (response["@odata.nextLink"]) {
          await sleep(500);
          return await getAlbum(response["@odata.nextLink"]);
        } else {
          this.logDebug("founded albums: ", found);
          return list;
        }
      } catch (err) {
        this.logError(`Error in getAlbum() ${err.toString()}`);
        this.logError(err.toString());
        throw err;
      }
    };
    return await getAlbum(url);
  }

  /**
   * 
   * @param {microsoftgraph.DriveItem} album 
   * @returns {Promise<string | null>}
   */
  async getAlbumThumbnail(album) {
    if (!album?.bundle?.album?.coverImageItemId) {
      return null;
    }
    try {
      const thumbnailUrl = protectedResources.getThumbnail.endpoint.replace('$$item-id$$', album.bundle.album.coverImageItemId);
      let response2 = await this.request('getAlbumThumbnail', thumbnailUrl, "get", null);
      if (Array.isArray(response2.value) && response2.value.length > 0) {
        const thumbnail = response2.value[0];
        const thumbnailUrl = thumbnail.mediumSquare?.url || thumbnail.medium?.url;
        this.logDebug("thumbnail found: ", album.bundle.album.coverImageItemId, (thumbnail.mediumSquare ? "mediumSquare" : (thumbnail.medium ? "medium" : "<null>")));
        return thumbnailUrl;
      }
    } catch (err) {
      this.logError("Error in getAlbumThumbnail(), ignore", err);
      return null;
    }
  }

  /**
   * @param {string} imageUrl
   * @returns {Promise<ExifReader.Tags>} EXIF data
   */
  async getEXIF(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const exifTags = ExifReader.load(buffer);
      return exifTags;
    } catch (err) {
      this.logError("getEXIF error:", err);
      return {};
    }
  }

  async getImageFromAlbum(albumId, isValid = null, maxNum = 99999) {
    await this.onAuthReady();
    let url = protectedResources.getChildrenInAlbum.endpoint.replace("$$userId$$", this.#userId).replace("$$albumId$$", albumId);

    this.log("Indexing photos. album:", albumId);
    /**
     * @type {OneDriveMediaItem[]}
     */
    let list = [];
    /**
     *
     * @param {string} pageUrl
     * @returns {Promise<OneDriveMediaItem[]>} DriveItem
     */
    const getImages = async (pageUrl) => {
      try {
        /** @type {import("@microsoft/microsoft-graph-client").PageCollection} */
        let response = await this.request('getImage', pageUrl, "get");
        if (Array.isArray(response.value)) {
          /** @type {microsoftgraph.DriveItem[]} */
          const childrenItems = response.value;
          for (let item of childrenItems) {
            /** @type {OneDriveMediaItem} */
            const itemVal = {
              id: item.id,
              _albumId: albumId,
              mimeType: item.file?.mimeType,
              baseUrl: item['@microsoft.graph.downloadUrl'],
              filename: item.name,
              mediaMetadata: {
                dateTimeOriginal: item.photo?.takenDateTime
                  || item.fileSystemInfo?.createdDateTime
                  || item.fileSystemInfo?.lastModifiedDateTime,
              },
              parentReference: item.parentReference,
            };
            if (list.length < maxNum) {
              if (item.image) {
                itemVal.mediaMetadata.width = item.image.width;
                itemVal.mediaMetadata.height = item.image.height;
              }
              if (item.photo) {
                itemVal.mediaMetadata.photo = {
                  cameraMake: item.photo.cameraMake,
                  cameraModel: item.photo.cameraModel,
                  focalLength: item.photo.focalLength,
                  apertureFNumber: item.photo.fNumber,
                  isoEquivalent: item.photo.iso,
                  exposureTime: item.photo.exposureNumerator && item.photo.exposureDenominator && item.photo.exposureDenominator !== 0 ? (item.photo.exposureNumerator * 1.0 / item.photo.exposureDenominator).toFixed(2) + 's' : null,
                };
              }
              if (item.video) {
                itemVal.mediaMetadata.width = item.video.width;
                itemVal.mediaMetadata.height = item.video.height;
                itemVal.mediaMetadata.video = item.video;
              }

              if (!item.photo?.takenDateTime) {
                const exifTags = await this.getEXIF(itemVal.baseUrl);
                if (exifTags && exifTags['DateTimeOriginal']) {
                  let dt = exifTags['DateTimeOriginal'].description;
                  // Convert 'YYYY:MM:DD HH:mm:ss' to ISO 8601 'YYYY-MM-DDTHH:mm:ss'
                  if (typeof dt === 'string' && dt.length > 0 && /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(dt)) {
                    dt = dt.replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})$/, '$1-$2-$3T$4');
                  }
                  itemVal.mediaMetadata.dateTimeOriginal = dt;
                  itemVal.mediaMetadata.manualExtractEXIF = true;
                }
              }

              if (typeof isValid === "function") {
                if (isValid(itemVal)) list.push(itemVal);
              } else {
                list.push(itemVal);
              }
            }
          }
          if (list.length >= maxNum) {
            this.log("Indexing photos done, found: ", list.length);
            return list; // full with maxNum
          } else {
            if (response["@odata.nextLink"]) {
              await sleep(500);
              return await getImages(response["@odata.nextLink"]);
            } else {
              return list; // all found but lesser than maxNum
            }
          }
        } else {
          return list; // empty
        }
      } catch (err) {
        this.logError(".getImageFromAlbum()", err.toString());
        this.logError(err);
        throw err;
      }
    };
    return await getImages(url);
  }

  /**
   * 
   * @param {OneDriveMediaItem[]} items
   * @returns {OneDriveMediaItem[]} items
   */
  async batchRequestRefresh(items) {
    if (items.length <= 0) {
      return [];
    }
    await this.onAuthReady();

    this.log("received: ", items.length, " to refresh");
    /**
     * https://learn.microsoft.com/en-us/graph/json-batching#batch-size-limitations
     * @type {[OneDriveMediaItem[]]}
     */
    const chunkGroups = chunk(items, 20);
    for (const grp of chunkGroups) {
      const requestsValue = grp.filter(i => i.item?.parentReference).map((item, i) => ({
        id: i,
        method: "GET",
        url: protectedResources.getItem.endpoint.replace("$$drive-id$$", item.parentReference.driveId).replace('$$item-id$$', item.id),
      }));
      if (requestsValue.length > 0) {
        const requestsPayload = {
          "requests": requestsValue,
        };
        const response = await this.request('batchRequestRefresh', protectedResources.$batch.endpoint, "post", requestsPayload);
        for (let r of response.response) {
          if (r.status < 400) {
            grp[r.id].baseUrl = r.body.value['@microsoft.graph.downloadUrl'];
          }
          else {
            console.error(r);
            grp[r.id].baseUrl = null;
          }
        }
      }
    }

    this.log("Batch request refresh done, total: ", items.length);

    return items;
  }
}

module.exports = OneDrivePhotos;
