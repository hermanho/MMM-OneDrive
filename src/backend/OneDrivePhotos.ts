"use strict";

import { EventEmitter } from "node:events";
import crypto from "node:crypto";
import { Client, PageCollection } from "@microsoft/microsoft-graph-client";
import { DeviceCodeResponse } from "@azure/msal-common";
import { LogLevel } from "@azure/msal-node";
import Log from "logger";
import { error_to_string } from "./functions/error_to_string";
import { msalConfig, protectedResources } from "./msal/authConfig";
import AuthProvider from "./msal/AuthProvider";
import sleep from "./functions/sleep";
import { ConfigTransformed } from "../types/config";
import { OneDriveMediaItem } from "../types/onedrive";
import { DriveItem } from "@microsoft/microsoft-graph-types";
import { cachePlugin } from "./msal/CachePlugin";
import { isOnline } from "./functions/isOnline";

type GraphLikeError = {
  code?: string;
  errorCode?: string;
};

type MediaItemValidator = (item: OneDriveMediaItem) => boolean;

type PageCollectionWithDriveItems = PageCollection & {
  value?: DriveItem[];
  "@odata.nextLink"?: string;
};

const generateNewExpirationDate = () => new Date(Date.now() + 55 * 60 * 1000).toISOString();

interface OneDrivePhotosParams {
  debug: boolean;
  config: ConfigTransformed;
  authTokenCachePath: string;
}

export class OneDrivePhotos extends EventEmitter {
  #userId: string | null = null;
  #debug = false;
  config: ConfigTransformed;
  getAuthProvider: () => AuthProvider;

  constructor(options: OneDrivePhotosParams) {
    super();
    this.#debug = options.debug ? options.debug : false;
    this.config = options.config;

    let authProviderInstance: AuthProvider | null = null;
    this.getAuthProvider = () => {
      if (authProviderInstance) {
        this.log("Get AuthProvider from cache");
        return authProviderInstance;
      }
      this.log("Initializing AuthProvider");
      if (this.#debug) {
        msalConfig.system.loggerOptions.logLevel = LogLevel.Trace;
      }
      authProviderInstance = new AuthProvider({
        ...msalConfig,
        cache: {
          cachePlugin: cachePlugin(options.authTokenCachePath),
        },
      });
      this.log("AuthProvider created");
      return authProviderInstance;
    };
  }

  log(...args) {
    Log.info("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }

  logError(...args) {
    Log.error("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }

  logDebug(...args) {
    Log.debug("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }

  logWarn(...args) {
    Log.warn("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }

  deviceCodeCallback(response: DeviceCodeResponse) {
    const expireDt = new Date(Date.now() + response.expiresIn * 1000);
    const message = response.message + `\nToken will be expired at ${expireDt.toLocaleTimeString(undefined, { hour12: true })}.`;
    this.emit("errorMessage", message);
  }

  private async createGraphClient() {
    let attempt = 0;
    const maxRetries = 3;
    while (attempt < maxRetries) {
      const tokenRequest = {
        scopes: protectedResources.graphMe.scopes,
        correlationId: crypto.randomUUID(),
      };
      try {
        const tokenResponse = await this.getAuthProvider().getToken(tokenRequest, (r) => this.deviceCodeCallback(r));
        if (!tokenResponse?.accessToken) {
          throw new Error("No access token returned from AuthProvider");
        }
        const graphClient = Client.init({
          authProvider: (done) => {
            done(null, tokenResponse.accessToken);
          },
        });
        return graphClient;
      } catch (err) {
        this.logError("onAuthReady error", err);

        // UnknownError is GraphError
        // TypeError is usually caused by network issues
        const errorCode = (err as GraphLikeError).code ?? (err as GraphLikeError).errorCode ?? "";
        const shouldRetry = ["UnknownError", "TypeError", "InvalidAuthenticationToken", "device_code_expired"].includes(errorCode);
        if (!shouldRetry) {
          this.logError("Not retrying onAuthReady due to unknown error");
          throw err;
        }
        this.logWarn(`Retrying onAuthReady, retry count: ${attempt}`);
        attempt++;
        // Sleep for 2 second and retry
        await sleep(2000);
        this.logWarn("Retrying onAuthReady");
      }
    }
    this.logError(`Failed to wait onAuthReady after ${maxRetries} attempts.`);
    throw new Error(`Failed to wait onAuthReady after ${maxRetries} attempts.`);

  }

  private async ensureGraphClient() {
    if (this.#userId) {
      return;
    }
    const graphClient = await this.createGraphClient();
    const graphResponse = await graphClient.api(protectedResources.graphMe.endpoint).get();
    if (!graphResponse?.id) {
      throw new Error("No user id returned from Graph API /me endpoint");
    }
    this.#userId = graphResponse.id;
  }

  private async request<T>(logContext, url, method = "get", data = null) {
    this.logDebug((logContext ? `[${logContext}]` : "") + ` request ${method} URL: ${url}`);

    const graphClient = await this.createGraphClient();

    try {
      const ret = await graphClient.api(url)[method](data);
      return ret as T;
    } catch (error) {
      this.logError((logContext ? `[${logContext}]` : "") + ` request fail ${method} URL: ${url}`);
      this.logError((logContext ? `[${logContext}]` : "") + " data: ", JSON.stringify(data));
      this.logError(error_to_string(error));
      throw error;
    }
  }

  async getAlbums() {
    if (!(await isOnline())) {
      this.logError("Device is offline, skip getAlbums");
      return [];
    }

    const albums = await this.getAlbumLoop();
    return albums;
  }

  private async getAlbumLoop() {
    await this.ensureGraphClient();
    const url = protectedResources.listAllAlbums.endpoint.replace("$$userId$$", this.#userId!);
    let list: DriveItem[] = [];
    let found = 0;

    const getAlbum = async (pageUrl: string) => {
      this.log("Getting Album info chunks.");
      try {
        const response = await this.request<PageCollectionWithDriveItems>("getAlbum", pageUrl, "get", null);
        if (Array.isArray(response.value)) {
          const arrayValue = response.value;
          this.logDebug("found album:");
          this.logDebug("name\t\tid");
          arrayValue.map((album) => `${album.name}\t${album.id}`).forEach((line) => this.logDebug(line));
          found += arrayValue.length;
          list = list.concat(arrayValue);
        }
        if (response["@odata.nextLink"]) {
          await sleep(500);
          return await getAlbum(response["@odata.nextLink"]);
        }

        this.logDebug("founded albums: ", found);
        return list;
      } catch (err) {
        this.logError(`Error in getAlbum() ${String(err)}`);
        this.logError(String(err));
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
      const thumbnailUrl = protectedResources.getThumbnail.endpoint.replace("$$itemId$$", album.bundle.album.coverImageItemId);
      const response2 = await this.request<PageCollection>("getAlbumThumbnail", thumbnailUrl, "get", null);
      if (Array.isArray(response2.value) && response2.value.length > 0) {
        const thumbnail = response2.value[0];
        const imageUrl = thumbnail.mediumSquare?.url || thumbnail.medium?.url;
        this.logDebug("thumbnail found: ", album.bundle.album.coverImageItemId, (thumbnail.mediumSquare ? "mediumSquare" : (thumbnail.medium ? "medium" : "<null>")));
        return imageUrl;
      }
    } catch (err) {
      this.logError("Error in getAlbumThumbnail(), ignore", err);
      return null;
    }
  }

  async getImageFromAlbum(albumId: string, isValid: MediaItemValidator | null = null, maxNum = 99999) {
    const url = protectedResources.getChildrenInAlbum.endpoint.replace("$$userId$$", this.#userId!).replace("$$albumId$$", albumId);

    this.log("Indexing photos. album:", albumId);

    const getImages = async (startUrl: string) => {
      let pageUrl = startUrl;
      let done = false;
      const list: OneDriveMediaItem[] = [];
      let loopCycle = 0;

      while (!done) {
        this.log(`getImages loop cycle: ${loopCycle}`);
        const startTime = Date.now();
        try {
          const response = await this.request<PageCollection>("getImages", pageUrl, "get");
          if (Array.isArray(response.value)) {
            const childrenItems = response.value as DriveItem[];
            this.log(`Parsing ${childrenItems.length} items in ${albumId}`);
            let validCount = 0;
            for (const item of childrenItems) {

              if (!item["@microsoft.graph.downloadUrl"]) {
                this.logWarn(`Item ${item.id} in album ${albumId} does not have downloadUrl, skipped`);
                continue;
              }

              const itemVal: OneDriveMediaItem = {
                id: item.id!,
                _albumId: albumId,
                mimeType: item.file?.mimeType || "",
                baseUrl: item["@microsoft.graph.downloadUrl"],
                baseUrlExpireDateTime: generateNewExpirationDate(),
                filename: item.name!,
                mediaMetadata: {
                  dateTimeOriginal:
                    item.photo?.takenDateTime ||
                    item.fileSystemInfo?.createdDateTime ||
                    item.fileSystemInfo?.lastModifiedDateTime || null,
                },
                parentReference: item.parentReference
                  ? {
                    driveId: item.parentReference.driveId || null,
                    driveType: item.parentReference.driveType || null,
                    id: item.parentReference.id || null,
                    name: item.parentReference.name || null,
                    path: item.parentReference.path || null,
                  }
                  : null,
              };
              if (list.length < maxNum) {
                if (item.image) {
                  itemVal.mediaMetadata.width = item.image.width!;
                  itemVal.mediaMetadata.height = item.image.height!;
                }
                if (item.photo) {
                  itemVal.mediaMetadata.photo = {
                    cameraMake: item.photo.cameraMake,
                    cameraModel: item.photo.cameraModel,
                    focalLength: item.photo.focalLength,
                    apertureFNumber: item.photo.fNumber,
                    isoEquivalent: item.photo.iso,
                    exposureTime:
                      item.photo.exposureNumerator &&
                        item.photo.exposureDenominator &&
                        item.photo.exposureDenominator !== 0
                        ? (
                          (item.photo.exposureNumerator * 1.0) /
                          item.photo.exposureDenominator
                        ).toFixed(2) + "s"
                        : null,
                  };
                }
                if (isValid) {
                  if (isValid(itemVal)) {
                    list.push(itemVal);
                    validCount++;
                  }
                } else {
                  list.push(itemVal);
                  validCount++;
                }
              }
            }
            this.logDebug(`Valid ${validCount} items in ${albumId}`);
            const endTime = Date.now();
            this.logDebug(`getImages loop cycle ${loopCycle} took ${endTime - startTime} ms`);
            if (list.length >= maxNum) {
              this.log("Indexing photos done, found: ", list.length);
              done = true;
              return list;
            } else if (response["@odata.nextLink"]) {
              this.logDebug(`Got nextLink, continue to get more images from album: ${albumId}`);
              pageUrl = response["@odata.nextLink"];
              loopCycle++;
              await sleep(500);
            } else {
              done = true;
              return list;
            }
          } else {
            this.logWarn(albumId, albumId);
            done = true;
            return list;
          }
        } catch (err) {
          this.logError(".getImageFromAlbum()", String(err));
          this.logError(err);
          throw err;
        }
      }
      return list;
    };
    return await getImages(url);
  }

  async refreshItem(item: OneDriveMediaItem) {
    if (!(await isOnline())) {
      this.logError("Device is offline, skip refreshItem for ", item.id, item.filename);
      return null;
    }

    this.log("received: ", item.id, " to refresh");
    const url = protectedResources.getItem.endpoint.replace("$$userId$$", this.#userId!).replace("$$itemId$$", item.id);

    try {
      const response = await this.request<{ "@microsoft.graph.downloadUrl": string }>("refreshItem", url, "get");
      if (!response) {
        throw new Error("No response from OneDrive API " + url);
      }
      this.log("Refresh done");
      return {
        baseUrl: response["@microsoft.graph.downloadUrl"],
        baseUrlExpireDateTime: generateNewExpirationDate(),
      };
    } catch (err) {
      this.logError("Error in refreshItem", { id: item.id, filename: item.filename });
      this.logError(error_to_string(err));
    }
  }
}