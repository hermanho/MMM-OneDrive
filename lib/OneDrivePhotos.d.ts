import { EventEmitter } from 'events';
import { DriveItem } from '@microsoft/microsoft-graph-types';

/**
 * @typedef {object} TokenRequestCommon
 * @property {string} scopes - The scopes requested for the token.
 */
declare class AuthProvider {
    clientApplication: any;
    /** @type {import("@azure/msal-node").AccountInfo} */
    account: any;
    constructor(msalConfig: any);
    logDebug(...args: any[]): void;
    logInfo(...args: any[]): void;
    logError(...args: any[]): void;
    logWarn(...args: any[]): void;
    logout(): Promise<void>;
    /**
     * @param {TokenRequestCommon} tokenRequest
     * @param {boolean} forceAuthInteractive
     * @param {(response: import("@azure/msal-common").DeviceCodeResponse) => void} deviceCodeCallback
     * @param {(message: string) => void} waitInteractiveCallback
     */
    getToken(tokenRequest: any, forceAuthInteractive: any, deviceCodeCallback?: any, waitInteractiveCallback?: any): Promise<any>;
    /**
     *
     * @param {Partial<import("@azure/msal-node").SilentFlowRequest> & TokenRequestCommon} tokenRequest
     */
    getTokenSilent(tokenRequest: any, maxRetries?: number): Promise<any>;
    /**
     *
     * @param {Partial<import("@azure/msal-node").InteractiveRequest> & TokenRequestCommon} tokenRequest
     */
    getTokenInteractive(tokenRequest: any): Promise<any>;
    /**
     *
     * @param {Partial<import("@azure/msal-node").DeviceCodeRequest> & TokenRequestCommon} tokenRequest
     * @param {(response: import("@azure/msal-common").DeviceCodeResponse) => void} callback
     */
    getTokenDeviceCode(tokenRequest: any, callback?: any): Promise<any>;
    /**
     * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    getAccount(): Promise<any>;
}

type AutoInfoPositionFunction = boolean | ((album: DriveItem, target: DriveItem) => (number | string)[]) | null;
type Config = {
  albums: (string | RegExp)[];
  updateInterval: number;
  sort: "new" | "old" | "random";
  condition: {
    fromDate: string | null;
    toDate: string | null;
    minWidth: number | null;
    maxWidth: number | null;
    minHeight: number | null;
    maxHeight: number | null;
    minWHRatio: number | null;
    maxWHRatio: number | null;
  };
  showWidth: number;
  showHeight: number;
  timeFormat: string;
  forceAuthInteractive: boolean;
  autoInfoPosition: AutoInfoPositionFunction;
};

type ConfigTransformed = Omit<Config, "albums"> & {
  albums: (string | {
    source: string,
    flags: string,
  })[];
};

interface OneDriveMediaItem {
  id: string;
  baseUrl?: string;
  baseUrlExpireDateTime?: string;
  mimeType: string;
  mediaMetadata: {
    dateTimeOriginal: string;
    width?: number;
    height?: number;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
  };
  parentReference: Partial<{
    driveId: string;
    driveType: string;
    id: string;
    name: string;
    path: string;
  }>;
  filename: string;
  _albumId: string;
}

interface OneDrivePhotosParams {
    debug: boolean;
    config: ConfigTransformed;
    authTokenCachePath: string;
}
declare class OneDrivePhotos extends EventEmitter {
    #private;
    config: ConfigTransformed;
    getAuthProvider: () => AuthProvider;
    constructor(options: OneDrivePhotosParams);
    log(...args: any[]): void;
    logError(...args: any[]): void;
    logDebug(...args: any[]): void;
    logWarn(...args: any[]): void;
    /**
     *
     * @param {import("@azure/msal-common").DeviceCodeResponse} response
     */
    deviceCodeCallback(response: any): void;
    onAuthReady(maxRetries?: number): Promise<void>;
    request<T>(logContext: any, url: any, method?: string, data?: any): Promise<T>;
    getAlbums(): Promise<any[]>;
    getAlbumLoop(): Promise<any[]>;
    /**
     *
     * @param {microsoftgraph.DriveItem} album
     * @returns {Promise<string | null>}
     */
    getAlbumThumbnail(album: any): Promise<any>;
    /**
     * @param {string} imageUrl
     * @returns {Promise<ExifReader.Tags>} EXIF data
     */
    getEXIF(imageUrl: any): Promise<{}>;
    getImageFromAlbum(albumId: any, isValid?: any, maxNum?: number): Promise<OneDriveMediaItem[]>;
    /**
     *
     * @param {OneDriveMediaItem[]} items
     * @returns {Promise<OneDriveMediaItem[]>} items
     */
    batchRequestRefresh(items: any): Promise<any[]>;
    refreshItem(item: OneDriveMediaItem): Promise<{
        baseUrl: any;
        baseUrlExpireDateTime: string;
    }>;
}

export { OneDrivePhotos };
