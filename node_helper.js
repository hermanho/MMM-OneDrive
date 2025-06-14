"use strict";

/**
 * @typedef {import("./types/type").OneDriveMediaItem} OneDriveMediaItem
 */

const fs = require("fs");
const { writeFile, readFile, mkdir } = require("fs/promises");
const path = require("path");
const moment = require("moment");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const { RE2 } = require("re2-wasm");
const { Set } = require("immutable");
const NodeHelper = require("node_helper");
const Log = require("logger");
const crypto = require("crypto");
const OneDrivePhotos = require("./OneDrivePhotos.js");
const { shuffle } = require("./shuffle.js");
const { error_to_string } = require("./error_to_string.js");
const { cachePath } = require("./msal/authConfig.js");
const { convertHEIC } = require("./photosConverter-node");
const { createIntervalRunner } = require("./interval-runner");

const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * @type {OneDrivePhotos}
 */
let oneDrivePhotosInstance = null;

const nodeHelperObject = {
  /** @type {OneDriveMediaItem[]} */
  localPhotoList: [],
  /** @type {number} */
  localPhotoPntr: 0,
  uiPhotoIndex: 0,
  uiRunner: null,
  start: function () {
    this.log_info("Starting module helper");
    this.scanInterval = 1000 * 60 * 55; // fixed. no longer needs to be fixed
    this.config = {};
    this.scanTimer = null;
    /** @type {microsoftgraph.DriveItem} */
    this.selectedAlbums = [];
    this.localPhotoList = [];
    this.photoRefreshPointer = 0;
    this.queue = null;
    this.initializeTimer = null;
    this.uiPhotoIndex = -1;

    this.CACHE_ALBUMNS_PATH = path.resolve(this.path, "cache", "selectedAlbumsCache.json");
    this.CACHE_PHOTOLIST_PATH = path.resolve(this.path, "cache", "photoListCache.json");
    this.CACHE_CONFIG = path.resolve(this.path, "cache", "config.json");
    this.log_info("Started");
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "INIT":
        this.initializeAfterLoading(payload);
        break;
      case "IMAGE_LOAD_FAIL":
        {
          const { url, event, source, lineno, colno, error, originalError, target } = payload;
          this.log_error("hidden.onerror", { event, originalError, source, lineno, colno });
          if (error) {
            this.log_error("hidden.onerror error", error.message, error.name, error.stack);
          }
          this.log_error("Image loading fails. Check your network.:", url);
          if (target?.baseUrlExpireDateTime) {
            this.log_error("Image baseUrlExpireDateTime:", target.baseUrlExpireDateTime);
          }
          // How many photos to load for 20 minutes?
          // this.prepAndSendChunk(Math.ceil((20 * 60 * 1000) / this.config.updateInterval)).then(); // 20min * 60s * 1000ms / updateinterval in ms
        }
        break;
      // case "IMAGE_LOADED":
      //   {
      //     this.log_debug("Image loaded:", payload);
      //   }
      //   break;
      // case "NEED_MORE_PICS":
      //   {
      //     this.log_info("Used last pic in list");
      //     // How many photos to load for 20 minutes?
      //     this.prepAndSendChunk(Math.ceil((20 * 60 * 1000) / this.config.updateInterval)).then(); // 20min * 60s * 1000ms / updateinterval in ms
      //   }
      //   break;
      case "MODULE_SUSPENDED_SKIP_UPDATE":
        this.log_debug("Module is suspended so skip the UI update");
        break;
      case "MODULE_SUSPENDED":
        this.uiRunner?.stop();
        break;
      case "MODULE_RESUMED":
        this.uiRunner?.resume();
        break;
      case "NEXT_PHOTO":
        this.uiRunner?.skipToNext();
        break;
      default:
        this.log_error("Unknown notification received", notification);
    }
  },

  log_debug: function (...args) {
    Log.debug("[MMM-OneDrive] [node_helper]", ...args);
  },

  log_info: function (...args) {
    Log.info("[MMM-OneDrive] [node_helper]", ...args);
  },

  log_error: function (...args) {
    Log.error("[MMM-OneDrive] [node_helper]", ...args);
  },

  log_warn: function (...args) {
    Log.warn("[MMM-OneDrive] [node_helper]", ...args);
  },

  initializeAfterLoading: async function (config) {
    this.config = config;
    this.debug = config.debug ? config.debug : false;
    if (!this.config.scanInterval || this.config.scanInterval < 1000 * 60 * 10) this.config.scanInterval = 1000 * 60 * 10;
    oneDrivePhotosInstance = new OneDrivePhotos({
      debug: this.debug,
      config: config,
    });
    oneDrivePhotosInstance.on("errorMessage", (message) => {
      this.uiRunner?.stop();
      this.sendSocketNotification("ERROR", message);
    });
    oneDrivePhotosInstance.on("authSuccess", () => {
      this.sendSocketNotification("CLEAR_ERROR");
      this.uiRunner?.resume();
    });

    this.albumsFilters = [];
    for (const album of config.albums) {
      if (album.hasOwnProperty("source") && album.hasOwnProperty("flags")) {
        this.albumsFilters.push(new RE2(album.source, album.flags + "u"));
      } else {
        this.albumsFilters.push(album);
      }
    }

    this.startUIRenderClock();
    await this.tryToIntitialize();
  },

  tryToIntitialize: async function () {
    //set timer, in case if fails to retry in 2 min
    clearTimeout(this.initializeTimer);
    this.initializeTimer = setTimeout(
      () => {
        this.tryToIntitialize();
      },
      2 * 60 * 1000,
    );

    this.log_info("Starting Initialization");
    await this.loadCache();

    this.log_info("Initialization complete!");
    clearTimeout(this.initializeTimer);
    this.log_info("Start first scanning.");
    this.startScanning();
  },

  calculateConfigHash: async function () {
    const tokenStr = await this.readFileSafe(cachePath, "MSAL Token");
    if (!tokenStr) {
      return undefined;
    }
    const hash = crypto.createHash("sha256").update(JSON.stringify(this.config) + "\n" + tokenStr)
      .digest("hex");
    return hash;
  },

  loadCache: async function () {
    const cacheHash = await this.readCacheConfig("CACHE_HASH");
    const configHash = await this.calculateConfigHash();
    if (!cacheHash || cacheHash !== configHash) {
      this.log_info("Config or token has changed. Ignore cache");
      this.log_debug("hash: ", { cacheHash, configHash });
      this.sendSocketNotification("UPDATE_STATUS", "Loading from OneDrive...");
      return;
    }
    this.log_info("Loading cache data");
    this.sendSocketNotification("UPDATE_STATUS", "Loading from cache");

    //load cached album list - if available
    const cacheAlbumDt = new Date(await this.readCacheConfig("CACHE_ALBUMNS_PATH"));
    const notExpiredCacheAlbum = cacheAlbumDt && (Date.now() - cacheAlbumDt.getTime() < ONE_DAY);
    this.log_debug("notExpiredCacheAlbum", { cacheAlbumDt, notExpiredCacheAlbum });
    if (notExpiredCacheAlbum && fs.existsSync(this.CACHE_ALBUMNS_PATH)) {
      this.log_info("Loading cached albumns list");
      try {
        const data = await readFile(this.CACHE_ALBUMNS_PATH, "utf-8");
        this.selectedAlbums = JSON.parse(data.toString());
        this.log_debug("successfully loaded selectedAlbums");
        // this.sendSocketNotification("UPDATE_ALBUMS", this.selectedAlbums); // for fast startup
      } catch (err) {
        this.log_error("unable to load selectedAlbums cache", err);
      }
    }

    //load cached list - if available
    const cachePhotoListDt = new Date(await this.readCacheConfig("CACHE_PHOTOLIST_PATH"));
    const notExpiredCachePhotoList = cachePhotoListDt && (Date.now() - cachePhotoListDt.getTime() < ONE_DAY);
    this.log_debug("notExpiredCachePhotoList", { cachePhotoListDt, notExpiredCachePhotoList });
    if (notExpiredCachePhotoList && fs.existsSync(this.CACHE_PHOTOLIST_PATH)) {
      this.log_info("Loading cached list");
      try {
        const data = await readFile(this.CACHE_PHOTOLIST_PATH, "utf-8");
        const cachedPhotoList = JSON.parse(data.toString());
        // check if the cached photo list is empty
        if (Array.isArray(cachedPhotoList) && cachedPhotoList.length >= 0) { //<<<<<
          this.localPhotoList = cachedPhotoList;
          if (this.config.sort === "random") {
            shuffle(cachedPhotoList);
          }
          this.localPhotoList = [...cachedPhotoList].map((photo, index) => {
            photo._indexOfPhotos = index;
            return photo;
          });
          this.log_info("successfully loaded photo list cache of ", this.localPhotoList.length, " photos");
          // await this.prepAndSendChunk(5); // only 5 for extra fast startup
          this.uiRunner?.skipToNext();
        }
      } catch (err) {
        this.log_error("unable to load photo list cache", err);
      }
    }

  },

  // prepAndSendChunk: async function (desiredChunk = 20) {
  //   this.log_debug("prepAndSendChunk");

  //   try {
  //     //find which ones to refresh
  //     if (this.photoRefreshPointer < 0 || this.photoRefreshPointer >= this.localPhotoList.length) {
  //       this.photoRefreshPointer = 0;
  //     }
  //     const numItemsToRefresh = Math.min(desiredChunk, this.localPhotoList.length - this.photoRefreshPointer, 20); //20 is api limit
  //     this.log_debug(`Num to ref: ${numItemsToRefresh}, DesChunk: ${desiredChunk}, TotalLength: ${this.localPhotoList.length}, Pntr: ${this.photoRefreshPointer}`);

  //     if (numItemsToRefresh <= 0) {
  //       this.log_warn(`No items to refresh. prepAndSendChunk skipped. DesChunk: ${desiredChunk}, TotalLength: ${this.localPhotoList.length}, Pntr: ${this.photoRefreshPointer}`);
  //       return;
  //     }

  //     /**
  //      * refresh them
  //      * @type {OneDriveMediaItem[]}
  //      */
  //     const list = await oneDrivePhotosInstance.batchRequestRefresh(this.localPhotoList.slice(this.photoRefreshPointer, this.photoRefreshPointer + numItemsToRefresh));

  //     if (list.length <= 0) {
  //       this.log_error("No items from batchRequestRefresh. prepAndSendChunk skipped");
  //       return;
  //     }

  //     // update the localList
  //     this.localPhotoList.splice(this.photoRefreshPointer, list.length, ...list);

  //     this.writeFileSafe(this.CACHE_PHOTOLIST_PATH, JSON.stringify(this.localPhotoList, null, 4), "Photo list cache");
  //     this.saveCacheConfig("CACHE_PHOTOLIST_PATH", new Date().toISOString());

  //     // send updated pics
  //     this.sendSocketNotification("MORE_PICS", list);

  //     // update pointer
  //     this.photoRefreshPointer = this.photoRefreshPointer + list.length;
  //     this.log_info("refreshed: ", list.length, ", totalLength: ", this.localPhotoList.length, ", Pntr: ", this.photoRefreshPointer);

  //     this.log_info("prepAndSendChunk done");
  //   } catch (err) {
  //     this.log_error("failed to refresh and send chunk: ");
  //     this.log_error(error_to_string(err));
  //     throw err;
  //   }
  // },

  /** @returns {Promise<microsoftgraph.DriveItem[]>} album */
  getAlbums: async function () {
    try {
      const r = await oneDrivePhotosInstance.getAlbums();
      const configHash = await this.calculateConfigHash();
      if (configHash) {
        await this.saveCacheConfig("CACHE_HASH", configHash);
      }
      return r;
    } catch (err) {
      this.log_error(error_to_string(err));
    }
  },

  startUIRenderClock: function () {
    this.log_info("Starting UI render clock");

    this.uiPhotoIndex = 0;

    this.uiRunner = createIntervalRunner(async () => {
      if (!this.localPhotoList || this.localPhotoList.length === 0) {
        this.log_warn("Not ready to render UI. No photos in list.");
        return;
      }
      this.log_info("Rendering UI...");
      const photo = this.localPhotoList[this.uiPhotoIndex];
      if (photo) {
        if (photo.baseUrlExpireDateTime && photo.baseUrlExpireDateTime < Date.now()) {
          await oneDrivePhotosInstance.refreshItem(photo);
        }

        let buffer = null;
        switch (photo.mimeType) {
          case "image/heic": {
            buffer = await convertHEIC({ id: photo.id, filename: photo.filename, url: photo.baseUrl });
            break;
          }
          default: {
            const resp = await fetch(photo.baseUrl);
            const arrayBuffer = await resp.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          }
        }
        const album = this.selectedAlbums.find((a) => a.id === photo._albumId);

        const base64 = buffer.toString("base64");

        this.log_debug("Image load:", { id: photo.id, filename: photo.filename, index: photo._indexOfPhotos });
        this.sendSocketNotification("NEW_PHOTO", { photoBase64: base64, photo, album, info: null, errorMessage: null });

        this.index++;
        if (this.index >= this.localPhotoList.length) {
          this.index = 0;
          this.needMorePicsFlag = true;
        }
      }
      this.uiPhotoIndex++;
      if (this.uiPhotoIndex >= this.localPhotoList.length) {
        this.uiPhotoIndex = 0;
      }
    }, this.config.updateInterval);
  },

  startScanning: function () {
    const fn = () => {
      const nextScanDt = new Date(Date.now() + this.scanInterval);
      this.scanJob().then(() => {
        this.log_info("Next scan will be at", nextScanDt);
      });
    };
    // set up interval, then 1 fail won't stop future scans
    this.scanTimer = setInterval(fn, this.scanInterval);
    // call for first time
    fn();
  },

  scanJob: async function () {
    this.log_info("Start Album scanning");
    this.queue = null;
    await this.getAlbumList();
    try {
      if (this.selectedAlbums.length > 0) {
        await this.getImageList();

        this.writeFileSafe(this.CACHE_PHOTOLIST_PATH, JSON.stringify(this.localPhotoList, null, 4), "Photo list cache").then(async () => {
          await this.saveCacheConfig("CACHE_PHOTOLIST_PATH", new Date().toISOString());
        });

        return true;
      } else {
        this.log_warn("There is no album to get photos.");
        return false;
      }
    } catch (err) {
      this.log_error(error_to_string(err));
    }
  },

  getAlbumList: async function () {
    this.log_info("Getting album list");
    /**
     * @type {microsoftgraph.DriveItem[]} 
     */
    const albums = await this.getAlbums();
    /** 
     * @type {microsoftgraph.DriveItem[]} 
     */
    let selectedAlbums = [];
    for (const ta of this.albumsFilters) {
      const matches = albums.filter((a) => {
        if (ta instanceof RE2) {
          this.log_debug(`RE2 match ${ta.source} -> '${a.title}' : ${ta.test(a.title)}`);
          return ta.test(a.title);
        } else {
          return ta === a.title;
        }
      });
      if (matches.length === 0) {
        this.log_warn(`Can't find "${ta instanceof RE2
          ? ta.source
          : ta}" in your album list.`);
      } else {
        selectedAlbums.push(...matches);
      }
    }
    selectedAlbums = Set(selectedAlbums).toArray();
    this.log_info("Finish Album scanning. Properly scanned :", selectedAlbums.length);
    this.log_info("Albums:", selectedAlbums.map((a) => a.title).join(", "));

    for (const album of selectedAlbums) {
      album.coverPhotoBaseUrl = await oneDrivePhotosInstance.getAlbumThumbnail(album);
    }


    this.writeFileSafe(this.CACHE_ALBUMNS_PATH, JSON.stringify(selectedAlbums, null, 4), "Album list cache");
    this.saveCacheConfig("CACHE_ALBUMNS_PATH", new Date().toISOString());

    for (const a of selectedAlbums) {
      if (a.coverPhotoBaseUrl) {
        const url = a.coverPhotoBaseUrl;
        const fpath = path.join(this.path, "cache", a.id);
        const file = fs.createWriteStream(fpath);
        const response = await fetch(url);
        await finished(Readable.fromWeb(response.body).pipe(file));
      }
    }
    this.selectedAlbums = selectedAlbums;
    this.log_info("getAlbumList done");
    // this.sendSocketNotification("INITIALIZED", selectedAlbums);
  },

  getImageList: async function () {
    this.log_info("Getting image list");
    const condition = this.config.condition;
    /**
     * @param {OneDriveMediaItem} photo
     */
    const photoCondition = (photo) => {
      if (!photo.hasOwnProperty("mediaMetadata")) return false;
      const data = photo.mediaMetadata;
      if (!photo.mimeType.startsWith("image/")) return false;
      const ct = moment(data.dateTimeOriginal);
      if (condition.fromDate && moment(condition.fromDate).isAfter(ct)) return false;
      if (condition.toDate && moment(condition.toDate).isBefore(ct)) return false;
      if (condition.minWidth && Number(condition.minWidth) > Number(data.width)) return false;
      if (condition.minHeight && Number(condition.minHeight) > Number(data.height)) return false;
      if (condition.maxWidth && Number(condition.maxWidth) < Number(data.width)) return false;
      if (condition.maxHeight && Number(condition.maxHeight) < Number(data.height)) return false;
      const whr = Number(data.width) / Number(data.height);
      if (condition.minWHRatio && Number(condition.minWHRatio) > whr) return false;
      if (condition.maxWHRatio && Number(condition.maxWHRatio) < whr) return false;
      return true;
    };
    /** @type {OneDriveMediaItem[]} */
    const photos = [];
    try {
      for (const album of this.selectedAlbums) {
        this.log_info(`Prepare to get photo list from '${album.title}'`);
        const list = await oneDrivePhotosInstance.getImageFromAlbum(album.id, photoCondition);
        list.forEach((i) => {
          i._albumTitle = album.title;
        });
        this.log_info(`Got ${list.length} photo(s) from '${album.title}'`);
        photos.push(...list);
      }
      if (photos.length > 0) {
        if (this.config.sort === "new" || this.config.sort === "old") {
          photos.sort((a, b) => {
            const at = moment(a.mediaMetadata.dateTimeOriginal);
            const bt = moment(b.mediaMetadata.dateTimeOriginal);
            if (at.isBefore(bt) && this.config.sort === "new") return 1;
            if (at.isAfter(bt) && this.config.sort === "old") return 1;
            return -1;
          });
        } else {
          shuffle(photos);
        }
        this.log_info(`Total indexed photos: ${photos.length}`);
        this.localPhotoList = [...photos].map((photo, index) => {
          photo._indexOfPhotos = index;
          return photo;
        });
        if (this.photoRefreshPointer >= this.localPhotoList.length) {
          this.photoRefreshPointer = 0;
        }
        // await this.prepAndSendChunk(50);
      } else {
        this.log_warn("photos.length is 0");
      }
    } catch (err) {
      this.log_error(error_to_string(err));
      throw err;
    }
  },

  stop: function () {
    clearInterval(this.scanTimer);
  },

  readFileSafe: async function (filePath, fileDescription) {
    if (!fs.existsSync(filePath)) {
      this.log_warn(`${fileDescription} does not exist: ${filePath}`);
      return null;
    }
    try {
      const data = await readFile(filePath, "utf-8");
      return data.toString();
    } catch (err) {
      this.log_error(`unable to read ${fileDescription}: ${filePath}`);
      this.log_error(error_to_string(err));
    }
  },

  writeFileSafe: async function (filePath, data, fileDescription) {
    try {
      const dirname = path.dirname(filePath);
      if (!fs.existsSync(dirname)) {
        await mkdir(dirname, { recursive: true });
      }
      await writeFile(filePath, data);
      this.log_debug(fileDescription + " saved");
    } catch (err) {
      this.log_error(`unable to write ${fileDescription}: ${filePath}`);
      this.log_error(error_to_string(err));
    }
  },

  readCacheConfig: async function (key) {
    try {
      let config = {};
      if (fs.existsSync(this.CACHE_CONFIG)) {
        const configStr = await this.readFileSafe(this.CACHE_CONFIG, "Cache Config");
        config = JSON.parse(configStr || null);
      }
      if (Object(config).hasOwnProperty(key)) {
        return config[key];
      } else {
        return undefined;
      }
    } catch (err) {
      this.log_error("unable to read Cache Config");
      this.log_error(error_to_string(err));
    }
  },

  saveCacheConfig: async function (key, value) {
    try {
      let config = {};
      if (fs.existsSync(this.CACHE_CONFIG)) {
        const configStr = await this.readFileSafe(this.CACHE_CONFIG, "Cache config JSON");
        config = JSON.parse(configStr || null) || {};
      }
      config[key] = value;
      await this.writeFileSafe(this.CACHE_CONFIG, JSON.stringify(config, null, 4), "Cache config JSON");
      this.log_debug(`Cache config ${key} saved`);
    } catch (err) {
      this.log_error("unable to write Cache Config");
      this.log_error(error_to_string(err));
    }
  },
};

module.exports = NodeHelper.create(nodeHelperObject);
