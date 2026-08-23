import { EventEmitter } from 'node:events';
import { DeviceCodeResponse } from '@azure/msal-common';
import { PublicClientApplication, AccountInfo, Configuration, SilentFlowRequest, AuthenticationResult } from '@azure/msal-node';
import { DriveItem } from '@microsoft/microsoft-graph-types';

declare class AuthProvider {
    clientApplication: PublicClientApplication;
    account: AccountInfo | undefined;
    constructor(msalConfig: Configuration);
    logDebug(...args: any[]): void;
    logInfo(...args: any[]): void;
    logError(...args: any[]): void;
    logWarn(...args: any[]): void;
    logout(): Promise<void>;
    getToken(request: Omit<SilentFlowRequest, "account">, deviceCodeCallback: ((response: DeviceCodeResponse) => void)): Promise<AuthenticationResult | null>;
    private getTokenSilent;
    private getTokenDeviceCode;
    /**
     * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    getAccount(): Promise<AccountInfo | null>;
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
    dateTimeOriginal: string | null | undefined;
    width?: number | null | undefined;
    height?: number | null | undefined;
    photo?: {
      cameraMake?: string | null;
      cameraModel?: string | null;
      focalLength?: number | null;
      apertureFNumber?: number | null;
      isoEquivalent?: number | null;
      exposureTime?: string | null;
    };
  };
  parentReference: Partial<{
    driveId: string | null;
    driveType: string | null;
    id: string | null;
    name: string | null;
    path: string | null;
  }> | null | undefined;
  filename: string;
  _albumId: string;
}

type MediaItemValidator = (item: OneDriveMediaItem) => boolean;
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
    deviceCodeCallback(response: DeviceCodeResponse): void;
    private onAuthReady;
    private request;
    getAlbums(): Promise<DriveItem[]>;
    private getAlbumLoop;
    /**
     *
     * @param {microsoftgraph.DriveItem} album
     * @returns {Promise<string | null>}
     */
    getAlbumThumbnail(album: any): Promise<any>;
    getImageFromAlbum(albumId: string, isValid?: MediaItemValidator | null, maxNum?: number): Promise<OneDriveMediaItem[]>;
    refreshItem(item: OneDriveMediaItem): Promise<{
        baseUrl: any;
        baseUrlExpireDateTime: string;
    } | null | undefined>;
}

export { OneDrivePhotos };
