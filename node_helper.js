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
const NodeHelper = require("node_helper");
const Log = require("logger");
const crypto = require("crypto");
const { OneDrivePhotos } = require("./lib/OneDrivePhotos.js");
const { shuffle } = require("./shuffle.js");
const { error_to_string } = require("./error_to_string.js");
const { createIntervalRunner } = require("./src/interval-runner");
const { urlToImageBase64 } = require("./lib/lib");

const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const TWO_DAYS = 2 * ONE_DAY; // 2 days in milliseconds
const DEFAULT_SCAN_INTERVAL = 1000 * 60 * 55;
const MINIMUM_SCAN_INTERVAL = 1000 * 60 * 10;

const cachePath = path.resolve(__dirname, "./msal/token.json");

/**
 * @type {OneDrivePhotos}
 */
let oneDrivePhotosInstance = null;

const nodeHelperObject = {
  /** @type {OneDriveMediaItem[]} */
  localPhotoList: [],
  /** @type {number} */
  localPhotoPntr: 0,
  uiRunner: null,
  moduleSuspended: false,
  start: function () {
    this.log_info("Starting module helper");
    this.config = {};
    this.scanTimer = null;
    /** @type {microsoftgraph.DriveItem} */
    this.selectedAlbums = [];
    this.localPhotoList = [];
    this.photoRefreshPointer = 0;
    this.queue = null;
    this.initializeTimer = null;

    this.CACHE_ALBUMNS_PATH = path.resolve(this.path, "cache", "selectedAlbumsCache.json");
    this.CACHE_PHOTOLIST_PATH = path.resolve(this.path, "cache", "photoListCache.json");
    this.CACHE_CONFIG = path.resolve(this.path, "cache", "config.json");
    this.log_info("Started");
  },

  socketNotificationReceived: function (notification, payload) {
    this.log_debug("notification received", notification);
    switch (notification) {
      case "INIT":
        this.initializeAfterLoading(payload);
        break;
      case "IMAGE_LOADED":
        {
          this.log_info("Image loaded:");
          this.log_info(JSON.stringify(payload));
        }
        break;
      case "MODULE_SUSPENDED":
        this.log_info("Module suspended");
        this.moduleSuspended = true;
        this.uiRunner?.stop();
        break;
      case "MODULE_RESUMED":
        this.log_info("Module resumed");
        this.moduleSuspended = false;
        this.uiRunner?.resume();
        break;
      case "NEXT_PHOTO":
        if (!this.moduleSuspended) {
          this.uiRunner?.skipToNext();
        }
        break;
      default:
        this.log_error("Unknown notification received", notification);
    }
  },

  log_debug: function (...args) {
    Log.debug(`[${this.name}] [node_helper]`, ...args);
  },

  log_info: function (...args) {
    Log.info(`[${this.name}] [node_helper]`, ...args);
  },

  log_error: function (...args) {
    Log.error(`[${this.name}] [node_helper]`, ...args);
  },

  log_warn: function (...args) {
    Log.warn(`[${this.name}] [node_helper]`, ...args);
  },

  initializeAfterLoading: async function (config) {
    this.config = config;
    this.debug = config.debug ? config.debug : false;
    if (!this.config.scanInterval) {
      this.config.scanInterval = DEFAULT_SCAN_INTERVAL;
    }
    if (this.config.scanInterval < MINIMUM_SCAN_INTERVAL) {
      this.config.scanInterval = MINIMUM_SCAN_INTERVAL;
    }
    oneDrivePhotosInstance = new OneDrivePhotos({
      debug: this.debug,
      config: config,
      authTokenCachePath: cachePath,
    });
    oneDrivePhotosInstance.on("errorMessage", (message) => {
      this.log_info("Stop UI runner");
      this.uiRunner?.stop();
      this.sendSocketNotification("ERROR", message);
    });
    oneDrivePhotosInstance.on("authSuccess", () => {
      this.sendSocketNotification("CLEAR_ERROR");
      this.log_info("Resume UI runner");
      if (!this.moduleSuspended) {
        this.uiRunner?.resume();
      } else {
        this.log_info("Module is suspended, skipping resume");
      }
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
    const cacheResult = await this.loadCache();

    if (cacheResult) {
      this.log_info("Show photos from cache for fast startup");
      this.uiRunner?.skipToNext();
    }

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

  /**
   * Loads the cache if it exists and is not expired.
   * If the cache is expired or does not exist, it will skip loading and return false.
   * @returns {Promise<boolean>} true if cache was loaded successfully, false otherwise
   */
  loadCache: async function () {
    const cacheHash = await this.readCacheConfig("CACHE_HASH");
    const configHash = await this.calculateConfigHash();
    if (!cacheHash || cacheHash !== configHash) {
      this.log_info("Config or token has changed. Ignore cache");
      this.log_debug("hash: ", { cacheHash, configHash });
      this.sendSocketNotification("UPDATE_STATUS", "Loading from OneDrive...");
      return false;
    }
    this.log_info("Loading cache data");
    this.sendSocketNotification("UPDATE_STATUS", "Loading from cache");

    //load cached album list - if available
    const cacheAlbumDt = new Date(await this.readCacheConfig("CACHE_ALBUMNS_PATH"));
    const notExpiredCacheAlbum = cacheAlbumDt && (Date.now() - cacheAlbumDt.getTime() < TWO_DAYS);
    this.log_debug("notExpiredCacheAlbum", { cacheAlbumDt, notExpiredCacheAlbum });
    if (notExpiredCacheAlbum && fs.existsSync(this.CACHE_ALBUMNS_PATH)) {
      this.log_info("Loading cached albumns list");
      try {
        const data = await readFile(this.CACHE_ALBUMNS_PATH, "utf-8");
        this.selectedAlbums = JSON.parse(data.toString());
        this.log_debug("successfully loaded selectedAlbums");
      } catch (err) {
        this.log_error("unable to load selectedAlbums cache", err);
      }
    }
    if (!Array.isArray(this.selectedAlbums) || this.selectedAlbums.length === 0) {
      this.log_warn("No valid albums found. Skipping photo loading.");
      return false;
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
        if (Array.isArray(cachedPhotoList) && cachedPhotoList.length > 0) {
          if (this.config.sort === "random") {
            shuffle(cachedPhotoList);
          }
          this.localPhotoList = [...cachedPhotoList].map((photo, index) => {
            photo._indexOfPhotos = index;
            return photo;
          });
          this.log_info("successfully loaded photo list cache of ", this.localPhotoList.length, " photos");
          return true;
        }
      } catch (err) {
        this.log_error("unable to load photo list cache", err);
      }
    }
    return false;
  },

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
    if (this.uiRunner) {
      this.log_info("UI render clock is already running. Skipped to re-create.");
      this.uiRunner.skipToNext();
      return;
    }
    this.log_info("Starting UI render clock");

    this.uiPhotoIndex = 0;

    this.uiRunner = createIntervalRunner(async () => {
      if (this.moduleSuspended) {
        this.log_warn("Module suspended and skipping UI render. The uiRunner should not be running, but something went wrong.");
        return;
      }
      if (!this.localPhotoList || this.localPhotoList.length === 0) {
        this.log_warn("Not ready to render UI. No photos in list.");
        return;
      }
      const photo = this.localPhotoList[this.uiPhotoIndex];

      await this.prepareShowPhoto({ photoId: photo.id });

      this.uiPhotoIndex++;
      if (this.uiPhotoIndex >= this.localPhotoList.length) {
        this.uiPhotoIndex = 0;
      }
    }, this.config.updateInterval);
  },

  startScanning: function () {
    if (this.scanTimer) {
      this.log_info("Scan album and photo now");
      this.scanTimer.skipToNext();
      return;
    }

    this.scanTimer = createIntervalRunner(async () => {
      const nextScanDt = new Date(Date.now() + this.config.scanInterval);
      await this.scanJob();
      this.log_info("Next scan will be at", nextScanDt.toLocaleString());

      if (this.uiRunner) {
        this.uiRunner.skipToNext();
      }

    }, this.config.scanInterval);
  },

  scanJob: async function () {
    this.queue = null;
    const startDt = Date.now();
    this.log_info("Run scanJob");
    this.sendSocketNotification("UPDATE_STATUS", "Refreshing cache from OneDrive...");
    try {
      await this.getAlbumList();
      if (this.selectedAlbums.length > 0) {
        await this.getImageList();
        this.savePhotoListCache();
        return true;
      } else {
        this.log_warn("There is no album to get photos.");
        return false;
      }
    } catch (err) {
      this.log_error(error_to_string(err));
    } finally {
      this.log_info("Run scanJob done, duration:", Date.now() - startDt);
      this.sendSocketNotification("UPDATE_STATUS", "");
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
    const selectedAlbums = [];
    for (const ta of this.albumsFilters) {
      const matches = albums.filter((a) => {
        if (ta instanceof RE2) {
          this.log_debug(`RE2 match ${ta.source} -> '${a.name}' : ${ta.test(a.name)}`);
          return ta.test(a.name);
        } else {
          return ta === a.name;
        }
      });
      if (matches.length === 0) {
        this.log_warn(`Can't find "${ta instanceof RE2
          ? ta.source
          : ta}" in your album list.`);
      } else {
        for (const match of matches) {
          if (!selectedAlbums.some(a => a.id === match.id)) {
            selectedAlbums.push(match);
          }
        }
      }
    }
    this.log_info("Finish Album scanning. Properly scanned :", selectedAlbums.length);
    this.log_info("Albums:", selectedAlbums.map((a) => a.name).join(", "));

    this.writeFileSafe(this.CACHE_ALBUMNS_PATH, JSON.stringify(selectedAlbums, null, 4), "Album list cache");
    this.saveCacheConfig("CACHE_ALBUMNS_PATH", new Date().toISOString());

    for (const a of selectedAlbums) {
      const url = await oneDrivePhotosInstance.getAlbumThumbnail(a);
      if (url) {
        const fpath = path.join(this.path, "cache", a.id);
        const file = fs.createWriteStream(fpath);
        const response = await fetch(url);
        await finished(Readable.fromWeb(response.body).pipe(file));
      }
    }
    this.selectedAlbums = selectedAlbums;
    this.log_info("getAlbumList done");
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
      // if (!photo.mimeType.startsWith("image/")) return false;
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
        this.log_info(`Prepare to get photo list from '${album.name}'`);
        const list = await oneDrivePhotosInstance.getImageFromAlbum(album.id, photoCondition);
        list.forEach((i) => {
          i._albumTitle = album.name;
        });
        this.log_info(`Got ${list.length} photo(s) from '${album.name}'`);
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
      } else {
        this.log_warn("photos.length is 0");
      }
    } catch (err) {
      this.log_error(error_to_string(err));
      throw err;
    }
  },

  prepareShowPhoto: async function ({ photoId }) {

    const photo = this.localPhotoList.find((p) => p.id === photoId);
    if (!photo) {
      this.log_error(`Photo with id ${photoId} not found in local list`);
      return;
    }
    const album = this.selectedAlbums.find((a) => a.id === photo._albumId);

    this.log_info("Loading to UI:", { id: photoId, filename: photo.filename, album: album?.name });

    if (photo?.baseUrlExpireDateTime) {
      const expireDt = new Date(photo.baseUrlExpireDateTime);
      if (!isNaN(+expireDt) && expireDt.getTime() < Date.now()) {
        this.log_info(`Image ${photo.filename} url expired ${photo.baseUrlExpireDateTime}, refreshing...`);
        const p = await oneDrivePhotosInstance.refreshItem(photo);
        photo.baseUrl = p.baseUrl;
        photo.baseUrlExpireDateTime = p.baseUrlExpireDateTime;
        this.log_info(`Image ${photo.filename} url refreshed new baseUrlExpireDateTime: ${photo.baseUrlExpireDateTime}`);
      }
    }

    try {
      const base64 = await urlToImageBase64(photo, { width: this.config.showWidth, height: this.config.showHeight });

      this.log_info("Image send to UI:");
      this.log_info(JSON.stringify({ id: photo.id, filename: photo.filename, index: photo._indexOfPhotos }));
      this.sendSocketNotification("RENDER_PHOTO", { photoBase64: base64, photo, album, info: null, errorMessage: null });
    } catch (err) {
      if (err?.name === "FetchHTTPError") {
        // silently skip the error
        return;
      }
      this.log_error("Image loading fails:", photo.id, photo.filename, photo.baseUrl);
      if (err) {
        this.log_error("error", err?.message, err?.name);
        this.log_error(err?.stack || err);
      }
    }
  },

  stop: function () {
    this.log_info("Stopping module helper");
    clearInterval(this.scanTimer);
  },

  savePhotoListCache: function () {
    (async () => {
      await this.writeFileSafe(this.CACHE_PHOTOLIST_PATH, JSON.stringify(this.localPhotoList, null, 4), "Photo list cache");
      await this.saveCacheConfig("CACHE_PHOTOLIST_PATH", new Date().toISOString());
    })();
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
    return null;
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
      // What if the config file is crashed?
      try {
        if (fs.existsSync(this.CACHE_CONFIG)) {
          const configStr = await this.readFileSafe(this.CACHE_CONFIG, "Cache config JSON");
          config = JSON.parse(configStr || null) || {};
        }
      } catch (err) {
        this.log_error("unable to read Cache Config");
        this.log_error(error_to_string(err));
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
