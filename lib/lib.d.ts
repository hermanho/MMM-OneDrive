import { EventEmitter } from 'node:stream';

interface OneDriveMediaItem {
  id: string;
  baseUrl?: string;
  baseUrlExpireDateTime?: string;
  mimeType: string;
  mediaMetadata: {
    dateTimeOriginal: string;
    manualExtractEXIF: boolean | null;
    width: string;
    height: string;
    photo: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
  };
  parentReference: {
    driveId: string;
    driveType: string;
    id: string;
    name: string;
    path: string;
  };
  filename: string;
  _albumId: string;
  _albumTitle: string;
  _indexOfPhotos: number;
}

declare function createIntervalRunner(render: (() => Promise<unknown>), interval: number): {
    skipToNext: () => void;
    stop: () => void;
    resume: () => void;
    state: () => {
        stopped: boolean;
        running: boolean;
    };
};

declare const internetStatusListener: EventEmitter<[never]>;

declare const urlToDisk: (photo: OneDriveMediaItem, dest: string, size: {
    width: number;
    height: number;
}) => Promise<number>;
declare const createDirIfNotExists: (dir: string) => Promise<void>;

export { createDirIfNotExists, createIntervalRunner, internetStatusListener, urlToDisk };
