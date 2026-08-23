export interface OneDriveMediaItem {
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
