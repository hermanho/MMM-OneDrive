jest.mock("./functions/sleep", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Client, GraphError } from "@microsoft/microsoft-graph-client";
import sleep from "./functions/sleep";
import * as logger from "../../tests/logger.mock.js";
import { OneDrivePhotos } from "./OneDrivePhotos";

describe("OneDrivePhotos", () => {
  let photos: any;
  let mockAuthProvider: { getToken: any };
  let initSpy: jest.SpiedFunction<typeof Client.init>;

  const createPhotos = () => new (OneDrivePhotos as any)({
    config: {},
    debug: false,
    authTokenCachePath: "/tmp/mmm-onedrive-test-token.json",
  });

  const mockSuccessfulGraphMe = () => {
    initSpy.mockReturnValue({
      api: jest.fn().mockReturnValue({
        get: jest.fn(() => Promise.resolve({ id: "user-id" })),
      }),
    } as any);
  };

  beforeEach(() => {
    photos = createPhotos();
    mockAuthProvider = {
      getToken: (jest.fn() as any).mockResolvedValue({
        accessToken: "token",
        expiresOn: new Date(Date.now() + 60 * 60 * 1000),
      }),
    };
    photos.getAuthProvider = () => mockAuthProvider as any;
    initSpy = jest.spyOn(Client, "init");
    mockSuccessfulGraphMe();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getImageFromAlbum", () => {
    let mockRequest: jest.SpiedFunction<any>;
    const albumId = "test-album-id";

    beforeEach(() => {
      mockRequest = jest.spyOn(photos, "request");
    });

    it("returns all valid images from a single page", async () => {
      mockRequest.mockResolvedValueOnce({
        value: [
          {
            id: "img1",
            file: { mimeType: "image/jpeg" },
            image: { width: 1920, height: 1080 },
            "@microsoft.graph.downloadUrl": "url1",
            name: "photo1.jpg",
            photo: { takenDateTime: "2024-01-01T12:00:00Z" },
            fileSystemInfo: {},
            parentReference: { driveId: "drive1" },
          },
          {
            id: "img2",
            file: { mimeType: "image/png" },
            image: { width: 1200, height: 900 },
            "@microsoft.graph.downloadUrl": "url2",
            name: "photo2.png",
            fileSystemInfo: { createdDateTime: "2024-01-02T12:00:00Z" },
            parentReference: { driveId: "drive1" },
          },
        ],
      });

      const result = await photos.getImageFromAlbum(albumId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "img1",
        baseUrl: "url1",
        filename: "photo1.jpg",
        mediaMetadata: expect.objectContaining({ width: 1920, height: 1080 }),
      });
      expect(result[1]).toMatchObject({ id: "img2", baseUrl: "url2", filename: "photo2.png" });
      expect(mockAuthProvider.getToken).toHaveBeenCalledTimes(1);
      expect(initSpy).toHaveBeenCalledTimes(1);
    });

    it("handles paged results and stops at maxNum", async () => {
      mockRequest
        .mockResolvedValueOnce({
          value: [
            {
              id: "img1",
              file: { mimeType: "image/jpeg" },
              "@microsoft.graph.downloadUrl": "url1",
              name: "photo1.jpg",
              fileSystemInfo: { createdDateTime: "2024-01-01T00:00:00Z" },
              parentReference: { driveId: "drive1" },
            },
          ],
          "@odata.nextLink": "next-page-url",
        })
        .mockResolvedValueOnce({
          value: [
            {
              id: "img2",
              file: { mimeType: "image/jpeg" },
              "@microsoft.graph.downloadUrl": "url2",
              name: "photo2.jpg",
              fileSystemInfo: { createdDateTime: "2024-01-02T00:00:00Z" },
              parentReference: { driveId: "drive1" },
            },
          ],
        });

      const result = await photos.getImageFromAlbum(albumId, null, 2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("img1");
      expect(result[1].id).toBe("img2");
      expect(logger.info).toHaveBeenCalledWith("[MMM-OneDrive] [OneDrivePhotos]", "getImages loop cycle: 0");
      expect(logger.info).toHaveBeenCalledWith("[MMM-OneDrive] [OneDrivePhotos]", "getImages loop cycle: 1");
      expect(sleep).toHaveBeenCalledWith(500);
    });

    it("applies isValid filter if provided", async () => {
      mockRequest.mockResolvedValueOnce({
        value: [
          {
            id: "img1",
            file: { mimeType: "image/jpeg" },
            "@microsoft.graph.downloadUrl": "url1",
            name: "photo1.jpg",
            fileSystemInfo: { createdDateTime: "2024-01-01T00:00:00Z" },
            parentReference: { driveId: "drive1" },
          },
          {
            id: "img2",
            file: { mimeType: "image/png" },
            "@microsoft.graph.downloadUrl": "url2",
            name: "photo2.png",
            fileSystemInfo: { createdDateTime: "2024-01-02T00:00:00Z" },
            parentReference: { driveId: "drive1" },
          },
        ],
      });

      const isValid = (item: any) => item.mimeType === "image/jpeg";
      const result = await photos.getImageFromAlbum(albumId, isValid);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("img1");
    });

    it("returns empty array if no images found", async () => {
      mockRequest.mockResolvedValueOnce({ value: [] });

      const result = await photos.getImageFromAlbum(albumId);

      expect(result).toEqual([]);
    });
  });

  describe("auth retry behavior", () => {
    it("retries onAuthReady when Graph returns InvalidAuthenticationToken", async () => {
      mockAuthProvider.getToken
        .mockResolvedValueOnce({ accessToken: "token-1", expiresOn: new Date(Date.now() + 60 * 60 * 1000) })
        .mockResolvedValueOnce({ accessToken: "token-2", expiresOn: new Date(Date.now() + 60 * 60 * 1000) });

      initSpy
        .mockReturnValueOnce({
          api: jest.fn().mockReturnValue({
            get: jest.fn(() => {
              const error = new GraphError(401, "InvalidAuthenticationToken");
              error.code = "InvalidAuthenticationToken";
              return Promise.reject(error);
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          api: jest.fn().mockReturnValue({
            get: jest.fn(() => Promise.resolve({ id: "user-id" })),
          }),
        } as any);

      jest.spyOn(photos, "request").mockResolvedValueOnce({ value: [] });

      const result = await photos.getImageFromAlbum("album-1");

      expect(result).toEqual([]);
      expect(mockAuthProvider.getToken).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenCalledWith(2000);
      expect(logger.warn).toHaveBeenCalledWith(
        "[MMM-OneDrive] [OneDrivePhotos]",
        "Retrying onAuthReady, retry count: 0",
      );
    });

    it("does not retry non-retriable auth errors", async () => {
      mockAuthProvider.getToken.mockRejectedValueOnce({ errorCode: "device_code_expired" });

      await expect(photos.getImageFromAlbum("album-1")).rejects.toMatchObject({ errorCode: "device_code_expired" });

      expect(mockAuthProvider.getToken).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalledWith(2000);
      expect(logger.error).toHaveBeenCalledWith(
        "[MMM-OneDrive] [OneDrivePhotos]",
        "Not retrying onAuthReady due to unknown error",
      );
    });
  });
});
