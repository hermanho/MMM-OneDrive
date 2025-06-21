import { AutoInfoPositionFunction, Config, ConfigTransformed } from "../types/config";
import type MomentLib from "moment";
import type { OneDriveMediaItem } from "../../types/type";

/**
 * Global or injected variable declarations
 * moment.js is lazy loaded so not available when script is loaded.
 */
declare const moment: typeof MomentLib;

Module.register<Config>("MMM-OneDrive", {
  defaults: {
    albums: [],
    updateInterval: 1000 * 30, // minimum 10 seconds.
    sort: "new", // "old", "random"
    condition: {
      fromDate: null, // Or "2018-03", RFC ... format available
      toDate: null, // Or "2019-12-25",
      minWidth: null, // Or 400
      maxWidth: null, // Or 8000
      minHeight: null, // Or 400
      maxHeight: null, // Or 8000
      minWHRatio: null,
      maxWHRatio: null,
      // WHRatio = Width/Height ratio ( ==1 : Squared Photo,   < 1 : Portraited Photo, > 1 : Landscaped Photo)
    },
    showWidth: 1080, // These values will be used for quality of downloaded photos to show. real size to show in your MagicMirror region is recommended.
    showHeight: 1920,
    timeFormat: "YYYY/MM/DD HH:mm",
    autoInfoPosition: false,
    forceAuthInteractive: false,
  },
  requiresVersion: "2.24.0",

  suspended: false,

  getScripts() {
    return ["moment.js"];
  },
  getStyles: function () {
    return ["MMM-OneDrive.css"];
  },

  start: function () {
    this.uploadableAlbum = null;
    this.albums = null;
    this.scanned = [];
    this.updateTimer = null;
    this.index = 0;
    this.needMorePicsFlag = true;
    this.firstScan = true;
    if (this.config.updateInterval < 1000 * 10) this.config.updateInterval = 1000 * 10;
    this.config.condition = Object.assign({}, this.defaults.condition, this.config.condition);

    const config: ConfigTransformed = { ...this.config };
    for (let i = 0; i < this.config.albums.length; i++) {
      const album = this.config.albums[i];
      if (album instanceof RegExp) {
        config.albums[i] = {
          source: album.source,
          flags: album.flags,
        };
      }
    }

    this.sendSocketNotification("INIT", config);
    this.dynamicPosition = 0;
  },

  socketNotificationReceived: function (noti, payload) {
    if (noti === "UPLOADABLE_ALBUM") {
      this.uploadableAlbum = payload;
    }
    if (noti === "INITIALIZED") {
      this.albums = payload;
      //set up timer once initialized, more robust against faults
      if (!this.updateTimer || this.updateTimer === null) {
        console.info("[MMM-OneDrive] Start timer for updating photos.");
        this.updateTimer = setInterval(() => {
          this.updatePhotos();
        }, this.config.updateInterval);
      }
    }
    if (noti === "UPDATE_ALBUMS") {
      this.albums = payload;
    }
    if (noti === "MORE_PICS") {
      if (payload && Array.isArray(payload) && payload.length > 0) {
        this.needMorePicsFlag = false;
        this.scanned = payload;
        this.index = 0;
      }
      if (this.firstScan) {
        this.updatePhotos(); //little faster starting
      }
    }
    if (noti === "ERROR") {
      const current = document.getElementById("ONEDRIVE_PHOTO_CURRENT");
      current.textContent = "";
      const errMsgContainer = document.createElement("div");
      Object.assign(errMsgContainer.style, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      });
      const errMsgDiv = document.createElement("div");
      Object.assign(errMsgDiv.style, {
        maxWidth: "70vw",
        fontSize: "1.5em",
      });
      errMsgDiv.textContent = payload;
      errMsgContainer.appendChild(errMsgDiv);
      current.appendChild(errMsgContainer);
    }
    if (noti === "CLEAR_ERROR") {
      const current = document.getElementById("ONEDRIVE_PHOTO_CURRENT");
      current.textContent = "";
    }
    if (noti === "UPDATE_STATUS") {
      const info = document.getElementById("ONEDRIVE_PHOTO_INFO");
      info.innerHTML = String(payload);
    }
    if (noti === "RENDER_PHOTO") {
      this.state = {
        type: "newPhoto",
        payload,
      };
      const { photo, photoBase64 } = payload;
      const mimeType = photo.mimeType === "image/heic" ? "image/jpeg" : photo.mimeType;
      const url = `data:${mimeType};base64,${photoBase64}`;
      console.debug("[MMM-OneDrive] render image", { id: photo.id });
      this.render(url, photo);
    }
  },

  notificationReceived: function (noti, _payload, _sender) {
    if (noti === "ONEDRIVE_PHOTO_NEXT") {
      this.updatePhotos();
    }
  },

  updatePhotos: function () {
    console.debug("[MMM-OneDrive] Updating photos..");
    this.firstScan = false;

    if (this.scanned.length === 0) {
      this.sendSocketNotification("NEED_MORE_PICS", []);
      return;
    }
    if (this.suspended) {
      this.sendSocketNotification("MODULE_SUSPENDED_SKIP_UPDATE", undefined);
      const info = document.getElementById("ONEDRIVE_PHOTO_INFO");
      info.innerHTML = "";
      return;
    }
    if (this.index >= this.scanned.length) {
      this.index -= this.scanned.length;
    }
    const photo: OneDriveMediaItem = this.scanned[this.index];

    this.sendSocketNotification("TRIGGER_SHOWING_PHOTO", { photoId: photo.id });

    this.needMorePicsFlag = false;

    this.index++;
    if (this.index >= this.scanned.length) {
      this.index = 0;
      this.needMorePicsFlag = true;
      setTimeout(() => {
        this.sendSocketNotification("NEED_MORE_PICS", []);
      }, 2000);
    }
  },

  render: function (url: string, target: OneDriveMediaItem) {
    console.debug("[MMM-OneDrive] render image", { id: target.id, url, mimeType: target.mimeType });
    const startDt = new Date();
    const back = document.getElementById("ONEDRIVE_PHOTO_BACKDROP");
    const current = document.getElementById("ONEDRIVE_PHOTO_CURRENT");
    current.textContent = "";
    back.style.backgroundImage = `url(${url})`;
    current.style.backgroundImage = `url(${url})`;
    current.classList.add("animated");
    const info = document.getElementById("ONEDRIVE_PHOTO_INFO");
    const album = this.albums.find((a) => a.id === target._albumId);
    if (this.config.autoInfoPosition) {
      let op: AutoInfoPositionFunction = (_album, _target) => {
        const now = new Date();
        const q = Math.floor(now.getMinutes() / 15);
        const r = [
          [0, "none", "none", 0],
          ["none", "none", 0, 0],
          ["none", 0, 0, "none"],
          [0, 0, "none", "none"],
        ];
        return r[q];
      };
      if (typeof this.config.autoInfoPosition === "function") {
        op = this.config.autoInfoPosition;
      }
      const [top, left, bottom, right] = op(album, target);
      info.style.setProperty("--top", String(top));
      info.style.setProperty("--left", String(left));
      info.style.setProperty("--bottom", String(bottom));
      info.style.setProperty("--right", String(right));
    }
    info.innerHTML = "";
    const albumCover = document.createElement("div");
    albumCover.classList.add("albumCover");
    albumCover.style.backgroundImage = `url(modules/MMM-OneDrive/cache/${album.id})`;
    const albumTitle = document.createElement("div");
    albumTitle.classList.add("albumTitle");
    albumTitle.innerHTML = album.title;
    const photoTime = document.createElement("div");
    photoTime.classList.add("photoTime");
    photoTime.innerHTML = this.config.timeFormat === "relative" ? moment(target.mediaMetadata.dateTimeOriginal).fromNow() : moment(target.mediaMetadata.dateTimeOriginal).format(this.config.timeFormat);
    const infoText = document.createElement("div");
    infoText.classList.add("infoText");

    info.appendChild(albumCover);
    infoText.appendChild(albumTitle);
    infoText.appendChild(photoTime);
    info.appendChild(infoText);
    console.debug("[MMM-OneDrive] render image done", { id: target.id, duration: new Date().getTime() - startDt.getTime() });
    this.sendSocketNotification("IMAGE_LOADED", {
      id: target.id,
      filename: target.filename,
      indexOfPhotos: target._indexOfPhotos,
    });
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.id = "ONEDRIVE_PHOTO";
    const back = document.createElement("div");
    back.id = "ONEDRIVE_PHOTO_BACKDROP";
    const current = document.createElement("div");
    current.id = "ONEDRIVE_PHOTO_CURRENT";
    if (this.data.position.search("fullscreen") === -1) {
      if (this.config.showWidth) wrapper.style.width = this.config.showWidth + "px";
      if (this.config.showHeight) wrapper.style.height = this.config.showHeight + "px";
    }
    current.addEventListener("animationend", () => {
      current.classList.remove("animated");
    });
    const info = document.createElement("div");
    info.id = "ONEDRIVE_PHOTO_INFO";
    info.innerHTML = "Loading...";
    wrapper.appendChild(back);
    wrapper.appendChild(current);
    wrapper.appendChild(info);
    console.info("[MMM-OneDrive] Dom updated!");
    return wrapper;
  },

  suspend() {
    this.suspended = true;
  },

  resume() {
    this.suspended = false;
  },
});
