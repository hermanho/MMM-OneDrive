"use strict";

const fs = require("fs");
const { writeFile, readFile, mkdir } = require("fs/promises");
const path = require("path");
const moment = require("moment");
const OneDrivePhotos = require("./OneDrivePhotos.js");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const { RE2 } = require("re2-wasm");
const { Set } = require('immutable');
const NodeHelper = require("node_helper");
const Log = require("logger");
const crypto = require("crypto");
const { shuffle } = require("./shuffle.js");
const { error_to_string } = require("./error_to_string");
const { cachePath } = require("./msal/authConfig.js");

const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * @type {OneDrivePhotos}
 */
let OneDrivePhoto = null;

const NodeHeleprObject = {
  start: function () {
    this.scanInterval = 1000 * 60 * 55; // fixed. no longer needs to be fixed
    this.config = {};
    this.scanTimer = null;
    /** @type {microsoftgraph.DriveItem} */
    this.selecetedAlbums = [];
    /** @type {OneDriveMediaItem[]} */
    this.localPhotoList = [];
    this.localPhotoPntr = 0;
    this.lastLocalPhotoPntr = 0;
    this.queue = null;
    this.uploadAlbumId;
    this.initializeTimer = null;

    this.CACHE_ALBUMNS_PATH = path.resolve(this.path, "cache", "selecetedAlbumsCache.json");
    this.CACHE_PHOTOLIST_PATH = path.resolve(this.path, "cache", "photoListCache.json");
    this.CACHE_CONFIG = path.resolve(this.path, "cache", "config.json");
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "INIT":
        this.initializeAfterLoading(payload);
        break;
      case "UPLOAD":
        this.upload(payload);
        break;
      case "IMAGE_LOAD_FAIL":
        {
          const { url, event, source, lineno, colno, error } = payload;
          this.log_error("[ONEDRIVE] hidden.onerror", { event, source, lineno, colno });
          if (error) {
            this.log_error("[ONEDRIVE] hidden.onerror error", error.message, error.name, error.stack);
          }
          this.log_error("Image loading fails. Check your network.:", url);
          this.prepAndSendChunk(Math.ceil((20 * 60 * 1000) / this.config.updateInterval)).then(); // 20min * 60s * 1000ms / updateinterval in ms
        }
        break;
      case "IMAGE_LOADED":
        {
          const { id, index } = payload;
          this.log_debug("Image loaded:", `${this.lastLocalPhotoPntr} + ${index}`, id);
        }
        break;
      case "NEED_MORE_PICS":
        {
          this.log_info("Used last pic in list");
          this.prepAndSendChunk(Math.ceil((20 * 60 * 1000) / this.config.updateInterval)).then(); // 20min * 60s * 1000ms / updateinterval in ms
        }
        break;
      case "MODULE_SUSPENDED_SKIP_UPDATE":
        this.log_debug("Module is suspended so skip the UI update");
        break;
      default:
        this.log_error("Unknown notification received", notification);
    }
  },

  log_debug: function (...args) {
    Log.debug("[ONEDRIVE] [node_helper]", ...args);
  },

  log_info: function (...args) {
    Log.info("[ONEDRIVE] [node_helper]", ...args);
  },

  log_error: function (...args) {
    Log.error("[ONEDRIVE] [node_helper]", ...args);
  },

  log_warn: function (...args) {
    Log.warn("[ONEDRIVE] [node_helper]", ...args);
  },

  upload: async function (path) {
    if (!this.uploadAlbumId) {
      this.log_info("No uploadable album exists.");
      return;
    }
    let uploadToken = await OneDrivePhoto.upload(path);
    if (uploadToken) {
      await OneDrivePhoto.create(uploadToken, this.uploadAlbumId);
      this.log_info("Upload completed.");
    } else {
      this.log_error("Upload Fails.");
    }
  },

  initializeAfterLoading: function (config) {
    this.config = config;
    this.debug = config.debug ? config.debug : false;
    if (!this.config.scanInterval || this.config.scanInterval < 1000 * 60 * 10) this.config.scanInterval = 1000 * 60 * 10;
    OneDrivePhoto = new OneDrivePhotos({
      debug: this.debug,
      config: config,
    });
    OneDrivePhoto.on("errorMessage", (message) => {
      this.sendSocketNotification("ERROR", message);
    });
    OneDrivePhoto.on("authSuccess", () => {
      this.sendSocketNotification("CLEAR_ERROR");
    });

    this.albumsFilters = [];
    for (let album of config.albums) {
      if (album.hasOwnProperty("source") && album.hasOwnProperty("flags")) {
        this.albumsFilters.push(new RE2(album.source, album.flags + 'u'));
      } else {
        this.albumsFilters.push(album);
      }
    }

    this.tryToIntitialize();
  },

  tryToIntitialize: async function () {
    //set timer, in case if fails to retry in 1 min
    clearTimeout(this.initializeTimer);
    this.initializeTimer = setTimeout(
      () => {
        this.tryToIntitialize();
      },
      1 * 60 * 1000,
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
    const hash = crypto.createHash("sha256").update(JSON.stringify(this.config) + '\n' + tokenStr).digest("hex");
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
        this.selecetedAlbums = JSON.parse(data.toString());
        this.log_debug("successfully loaded selecetedAlbums");
        this.sendSocketNotification("UPDATE_ALBUMS", this.selecetedAlbums); // for fast startup
      } catch (err) {
        this.log_error("unable to load selecetedAlbums cache", err);
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
        this.localPhotoList = JSON.parse(data.toString());
        if (this.config.sort === "random") {
          shuffle(this.localPhotoList);
        }
        this.log_info("successfully loaded photo list cache of ", this.localPhotoList.length, " photos");
        await this.prepAndSendChunk(5); // only 5 for extra fast startup
      } catch (err) {
        this.log_error("unable to load photo list cache", err);
      }
    }

  },

  prepAndSendChunk: async function (desiredChunk = 20) {
    // if (this.lastScanTime && (new Date() - this.lastScanTime) < 30000) {
    //   return;
    // }
    // this.lastScanTime = new Date();
    this.log_debug("prepAndSendChunk");

    try {
      //find which ones to refresh
      if (this.localPhotoPntr < 0 || this.localPhotoPntr >= this.localPhotoList.length) {
        this.localPhotoPntr = 0;
        this.lastLocalPhotoPntr = 0;
      }
      let numItemsToRefresh = Math.min(desiredChunk, this.localPhotoList.length - this.localPhotoPntr, 20); //20 is api limit
      this.log_debug("num to ref: ", numItemsToRefresh, ", DesChunk: ", desiredChunk, ", totalLength: ", this.localPhotoList.length, ", Pntr: ", this.localPhotoPntr);

      const cachePath = this.path + "/cache/";

      /**
       * refresh them
       * @type {OneDriveMediaItem[]}
       */
      let list = [];
      if (numItemsToRefresh > 0) {
        list = await OneDrivePhoto.batchRequestRefresh(this.localPhotoList.slice(this.localPhotoPntr, this.localPhotoPntr + numItemsToRefresh), cachePath);
      }

      if (list.length > 0) {
        // update the localList
        this.localPhotoList.splice(this.localPhotoPntr, list.length, ...list);

        // send updated pics
        this.sendSocketNotification("MORE_PICS", list);

        // update pointer
        this.lastLocalPhotoPntr = this.localPhotoPntr;
        this.localPhotoPntr = this.localPhotoPntr + list.length;
        this.log_debug("refreshed: ", list.length, ", totalLength: ", this.localPhotoList.length, ", Pntr: ", this.localPhotoPntr);
      } else {
        this.log_error("couldn't send ", list.length, " pics");
      }
    this.log_info("prepAndSendChunk done");
    } catch (err) {
      this.log_error("failed to refresh and send chunk: ");
      this.log_error(error_to_string(err));
    }
  },

  /** @returns {microsoftgraph.DriveItem[]} album */
  getAlbums: async function () {
    try {
      let r = await OneDrivePhoto.getAlbums();
      r.forEach(item => {
        item.title = item.name;
      });
      const configHash = await this.calculateConfigHash();
      if (configHash) {
        await this.saveCacheConfig("CACHE_HASH", configHash);
      }
      return r;
    } catch (err) {
      this.log_error(error_to_string(err));
    }
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
      if (this.selecetedAlbums.length > 0) {
        this.photos = await this.getImageList();
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
    let albums = await this.getAlbums();
    /** 
     * @type {microsoftgraph.DriveItem[]} 
     */
    let selecetedAlbums = [];
    for (let ta of this.albumsFilters) {
      const matches = albums.filter((a) => {
        if (ta instanceof RE2) {
          this.log_debug(`RE2 match ${ta.source} -> '${a.title}' : ${ta.test(a.title)}`);
          return ta.test(a.title);
        }
        else {
          return ta === a.title;
        }
      });
      if (matches.length === 0) {
        this.log_warn(`Can't find "${ta instanceof RE2 ? ta.source : ta}" in your album list.`);
      }
      else {
        selecetedAlbums.push(...matches);
      }
    }
    selecetedAlbums = Set(selecetedAlbums).toArray();
    this.log_info("Finish Album scanning. Properly scanned :", selecetedAlbums.length);
    this.log_info("Albums:", selecetedAlbums.map((a) => a.title).join(", "));
    this.writeFileSafe(this.CACHE_ALBUMNS_PATH, JSON.stringify(selecetedAlbums, null, 4), "Album list cache");
    this.saveCacheConfig("CACHE_ALBUMNS_PATH", new Date().toISOString());

    for (let a of selecetedAlbums) {
      if (a.coverPhotoBaseUrl) {
        let url = a.coverPhotoBaseUrl;
        let fpath = path.join(this.path, "cache", a.id);
        let file = fs.createWriteStream(fpath);
        const response = await fetch(url);
        await finished(Readable.fromWeb(response.body).pipe(file));
      }
    }
    this.selecetedAlbums = selecetedAlbums;
    this.log_info("getAlbumList done");
    this.sendSocketNotification("INITIALIZED", selecetedAlbums);
  },

  getImageList: async function () {
    this.log_info("Getting image list");
    let condition = this.config.condition;
    /**
     * @param {OneDriveMediaItem} photo
     */
    let photoCondition = (photo) => {
      if (!photo.hasOwnProperty("mediaMetadata")) return false;
      let data = photo.mediaMetadata;
      if (data.hasOwnProperty("video")) return false;
      if (!data.hasOwnProperty("photo")) return false;
      let ct = moment(data.creationTime);
      if (condition.fromDate && moment(condition.fromDate).isAfter(ct)) return false;
      if (condition.toDate && moment(condition.toDate).isBefore(ct)) return false;
      if (condition.minWidth && Number(condition.minWidth) > Number(data.width)) return false;
      if (condition.minHeight && Number(condition.minHeight) > Number(data.height)) return false;
      if (condition.maxWidth && Number(condition.maxWidth) < Number(data.width)) return false;
      if (condition.maxHeight && Number(condition.maxHeight) < Number(data.height)) return false;
      let whr = Number(data.width) / Number(data.height);
      if (condition.minWHRatio && Number(condition.minWHRatio) > whr) return false;
      if (condition.maxWHRatio && Number(condition.maxWHRatio) < whr) return false;
      return true;
    };
    // let sort = (a, b) => {
    //   let at = moment(a.mediaMetadata.creationTime);
    //   let bt = moment(b.mediaMetadata.creationTime);
    //   if (at.isBefore(bt) && this.config.sort === "new") return 1;
    //   if (at.isAfter(bt) && this.config.sort === "old") return 1;
    //   return -1;
    // };
    /** @type {OneDriveMediaItem[]} */
    let photos = [];
    try {
      for (let album of this.selecetedAlbums) {
        this.log_info(`Prepare to get photo list from '${album.title}'`);
        let list = await OneDrivePhoto.getImageFromAlbum(album.id, photoCondition);
        list.forEach((i) => {
          i._albumTitle = album.title;
        });
        this.log_info(`Got ${list.length} photo(s) from '${album.title}'`);
        photos = photos.concat(list);
      }
      if (photos.length > 0) {
        if (this.config.sort === "new" || this.config.sort === "old") {
          photos.sort((a, b) => {
            let at = moment(a.mediaMetadata.creationTime);
            let bt = moment(b.mediaMetadata.creationTime);
            if (at.isBefore(bt) && this.config.sort === "new") return 1;
            if (at.isAfter(bt) && this.config.sort === "old") return 1;
            return -1;
          });
        } else {
          shuffle(photos);
        }
        this.log_info(`Total indexed photos: ${photos.length}`);
        this.localPhotoList = [...photos];
        this.localPhotoPntr = 0;
        this.lastLocalPhotoPntr = 0;
        this.prepAndSendChunk(50).then();
        this.writeFileSafe(this.CACHE_PHOTOLIST_PATH, JSON.stringify(photos, null, 4), "Photo list cache");
        this.saveCacheConfig("CACHE_PHOTOLIST_PATH", new Date().toISOString());
      } else {
        this.log_warn(`photos.length is 0`);
      }

      return photos;
    } catch (err) {
      this.log_error(error_to_string(err));
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
      }
      else {
        return undefined;
      }
    } catch (err) {
      this.log_error(`unable to read Cache Config`);
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
      this.log_error(`unable to write Cache Config`);
      this.log_error(error_to_string(err));
    }
  },
};

module.exports = NodeHelper.create(NodeHeleprObject);
