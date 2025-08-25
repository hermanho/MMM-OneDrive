export interface OneDriveMediaItem {
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
