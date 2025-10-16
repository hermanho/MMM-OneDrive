import { AutoInfoPositionFunction, Config, ConfigTransformed } from "../types/config";
import type MomentLib from "moment";
import type { OneDriveMediaItem } from "../../types/type";
import type { DriveItem } from "@microsoft/microsoft-graph-types";

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
      if (current) {
        current.textContent = "";
      }
    }
    if (noti === "UPDATE_STATUS") {
      const statusMessage = document.getElementById("ONEDRIVE_PHOTO_STATUS");
      statusMessage.innerHTML = String(payload);
    }
    if (noti === "RENDER_PHOTO") {
      this.state = {
        type: "newPhoto",
        payload,
      };
      const { photo, album, url } = payload;
      this.render(url, photo, album);
    }
  },

  notificationReceived: function (noti, _payload, _sender) {
    if (noti === "ONEDRIVE_PHOTO_NEXT") {
      this.sendSocketNotification("NEXT_PHOTO", []);
    }
  },

  cleanUpAlbumCoverMemory: function () {
    const info = document.getElementById("ONEDRIVE_PHOTO_INFO");
    if (!info) {
      return;
    }
    // MEMORY CLEANUP: Clear old info content and any old background images
    if (info.firstChild) {
      const oldAlbumCover = info.querySelector(".albumCover") as HTMLElement;
      if (oldAlbumCover && oldAlbumCover.style.backgroundImage) {
        oldAlbumCover.style.backgroundImage = "";
      }
    }
    info.innerHTML = "";
  },
  cleanUpPresentPhotoMemory: function () {
    // MEMORY CLEANUP: Clear previous background images to free memory
    const back = document.getElementById("ONEDRIVE_PHOTO_BACKDROP");
    const current = document.getElementById("ONEDRIVE_PHOTO_CURRENT");
    if (back) {
      back.style.backgroundImage = "";
    }
    if (current) {
      current.style.backgroundImage = "";
      current.textContent = "";
    }
  },

  render: function (url: string, target: OneDriveMediaItem, album: DriveItem) {
    if (this.suspended) {
      console.info("[MMM-OneDrive] Module is suspended, skipping render");
      return;
    }

    this.cleanUpPresentPhotoMemory();
    this.cleanUpAlbumCoverMemory();

    const back = document.getElementById("ONEDRIVE_PHOTO_BACKDROP");
    const current = document.getElementById("ONEDRIVE_PHOTO_CURRENT");
    back.style.backgroundImage = `url(${url})`;
    current.style.backgroundImage = `url(${url})`;
    current.classList.add("animated");

    const info = document.getElementById("ONEDRIVE_PHOTO_INFO");
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

    const albumCover = document.createElement("div");
    albumCover.classList.add("albumCover");
    albumCover.style.backgroundImage = `url(modules/MMM-OneDrive/cache/${album.id})`;
    const albumTitle = document.createElement("div");
    albumTitle.classList.add("albumTitle");
    albumTitle.innerHTML = album.name;

    const photoTime = document.createElement("div");
    photoTime.classList.add("photoTime");
    photoTime.innerHTML = this.config.timeFormat === "relative" ? moment(target.mediaMetadata.dateTimeOriginal).fromNow() : moment(target.mediaMetadata.dateTimeOriginal).format(this.config.timeFormat);
    const infoText = document.createElement("div");
    infoText.classList.add("infoText");

    info.appendChild(albumCover);
    info.appendChild(infoText);
    infoText.appendChild(albumTitle);
    infoText.appendChild(photoTime);
    console.debug("[MMM-OneDrive] render image done",
      JSON.stringify({
        id: target.id,
        filename: target.filename,
      }));
    this.sendSocketNotification("IMAGE_LOADED", {
      id: target.id,
      filename: target.filename,
      index: target._indexOfPhotos,
    });
  },

  getDom: function () {
    // MEMORY CLEANUP: Remove old wrapper if it exists
    this.cleanUpPresentPhotoMemory();
    this.cleanUpAlbumCoverMemory();
    const oldWrapper = document.getElementById("ONEDRIVE_PHOTO");
    if (oldWrapper) {
      oldWrapper.remove();
    }

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
    const overlayPresentation = document.createElement("div");
    overlayPresentation.id = "ONEDRIVE_PHOTO_OVERLAY";
    const statusMessageWrapper = document.createElement("div");
    statusMessageWrapper.id = "ONEDRIVE_PHOTO_STATUS_WRAPPER";
    const statusMessage = document.createElement("div");
    statusMessage.id = "ONEDRIVE_PHOTO_STATUS";
    statusMessage.innerHTML = "Loading...";
    const infoWrapper = document.createElement("div");
    infoWrapper.id = "ONEDRIVE_PHOTO_INFO_WRAPPER";
    const info = document.createElement("div");
    info.id = "ONEDRIVE_PHOTO_INFO";

    wrapper.appendChild(back);
    wrapper.appendChild(current);
    wrapper.appendChild(overlayPresentation);

    overlayPresentation.appendChild(infoWrapper);
    infoWrapper.appendChild(info);

    overlayPresentation.appendChild(statusMessageWrapper);
    statusMessageWrapper.appendChild(statusMessage);
    console.info("[MMM-OneDrive] Dom updated!");
    return wrapper;
  },

  suspend() {
    this.sendSocketNotification("MODULE_SUSPENDED", undefined);
    this.suspended = true;

    this.cleanUpPresentPhotoMemory();
    this.cleanUpAlbumCoverMemory();

    const statusMessage = document.getElementById("ONEDRIVE_PHOTO_STATUS");
    statusMessage.innerHTML = "";

  },

  resume() {
    this.sendSocketNotification("MODULE_RESUMED", undefined);
    this.suspended = false;
  },
});
