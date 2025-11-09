import { EventEmitter } from 'events';
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-node';
import { DeviceCodeResponse } from '@azure/msal-common';
import { DriveItem } from '@microsoft/microsoft-graph-types';

interface TokenRequestCommon {
    account: AccountInfo;
    scopes: string[];
}
declare class AuthProvider {
    clientApplication: PublicClientApplication;
    account: AccountInfo;
    constructor(msalConfig: any);
    logDebug(...args: any[]): void;
    logInfo(...args: any[]): void;
    logError(...args: any[]): void;
    logWarn(...args: any[]): void;
    logout(): Promise<void>;
    getToken(request: Omit<TokenRequestCommon, "account">, forceAuthInteractive: boolean, deviceCodeCallback?: (response: DeviceCodeResponse) => void): Promise<AuthenticationResult>;
    private getTokenSilent;
    private getTokenDeviceCode;
    /**
     * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    getAccount(): Promise<AccountInfo>;
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
    private onAuthReady;
    private request;
    getAlbums(): Promise<any[]>;
    private getAlbumLoop;
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
    refreshItem(item: OneDriveMediaItem): Promise<{
        baseUrl: any;
        baseUrlExpireDateTime: string;
    }>;
}

export { OneDrivePhotos };
