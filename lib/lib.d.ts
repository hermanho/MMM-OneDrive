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

declare const urlToImageBase64: (photo: OneDriveMediaItem, size: {
    width: number;
    height: number;
}) => Promise<string>;

export { urlToImageBase64 };
