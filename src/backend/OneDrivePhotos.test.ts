import { OneDrivePhotos } from "./OneDrivePhotos";
import * as logger from "../../tests/logger.mock.js";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("OneDrivePhotos", () => {
  describe("getImageFromAlbum", () => {
    let photos: any;
    let mockRequest: jest.SpiedFunction<any>;
    const albumId = "test-album-id";

    beforeEach(() => {
      photos = new (OneDrivePhotos as any)({ config: {}, debug: false });
      mockRequest = jest.spyOn(photos, "request");
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns all valid images from a single page", async () => {
      mockRequest.mockResolvedValueOnce({
        value: [
          {
            id: "img1",
            file: { mimeType: "image/jpeg" },
            "@microsoft.graph.downloadUrl": "url1",
            name: "photo1.jpg",
            photo: { takenDateTime: "2024-01-01T12:00:00Z" },
            fileSystemInfo: {},
            parentReference: { driveId: "drive1" },
          },
          {
            id: "img2",
            file: { mimeType: "image/png" },
            "@microsoft.graph.downloadUrl": "url2",
            name: "photo2.png",
            fileSystemInfo: { createdDateTime: "2024-01-02T12:00:00Z" },
            parentReference: { driveId: "drive1" },
          },
        ],
      });
      const result = await photos.getImageFromAlbum(albumId);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "img1", baseUrl: "url1", filename: "photo1.jpg" });
      expect(result[1]).toMatchObject({ id: "img2", baseUrl: "url2", filename: "photo2.png" });
    });

    it("handles paged results and stops at maxNum", async () => {
      mockRequest
        .mockResolvedValueOnce({
          value: [
            { id: "img1", file: { mimeType: "image/jpeg" }, "@microsoft.graph.downloadUrl": "url1", name: "photo1.jpg", fileSystemInfo: {}, parentReference: { driveId: "drive1" } },
          ],
          "@odata.nextLink": "next-page-url",
        })
        .mockResolvedValueOnce({
          value: [
            { id: "img2", file: { mimeType: "image/jpeg" }, "@microsoft.graph.downloadUrl": "url2", name: "photo2.jpg", fileSystemInfo: {}, parentReference: { driveId: "drive1" } },
          ],
        });
      const result = await photos.getImageFromAlbum(albumId, null, 2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("img1");
      expect(result[1].id).toBe("img2");
      expect(logger.debug).toHaveBeenCalledWith(
        "[ONEDRIVE:CORE]",
        "getImages loop cycle: 0"
      );
      expect(logger.debug).toHaveBeenCalledWith(
        "[ONEDRIVE:CORE]",
        "getImages loop cycle: 1"
      );
    });

    it("applies isValid filter if provided", async () => {
      mockRequest.mockResolvedValueOnce({
        value: [
          { id: "img1", file: { mimeType: "image/jpeg" }, "@microsoft.graph.downloadUrl": "url1", name: "photo1.jpg", fileSystemInfo: {}, parentReference: { driveId: "drive1" } },
          { id: "img2", file: { mimeType: "image/png" }, "@microsoft.graph.downloadUrl": "url2", name: "photo2.png", fileSystemInfo: {}, parentReference: { driveId: "drive1" } },
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

    it.skip("skips getEXIF for non-image mime types", async () => {
      mockRequest.mockResolvedValueOnce({
        value: [
          {
            id: "img1",
            file: { mimeType: "image/jpeg" },
            "@microsoft.graph.downloadUrl": "url1",
            name: "photo1.jpg",
            fileSystemInfo: {},
            parentReference: { driveId: "drive1" },
          },
          {
            id: "doc1",
            file: { mimeType: "application/pdf" },
            "@microsoft.graph.downloadUrl": "url2",
            name: "doc1.pdf",
            fileSystemInfo: {},
            parentReference: { driveId: "drive1" },
          },
        ],
      });
      const getEXIFSpy = jest.spyOn(photos, "getEXIF").mockResolvedValue({});
      await photos.getImageFromAlbum(albumId);
      // getEXIF should be called only for the image/jpeg item
      expect(getEXIFSpy).toHaveBeenCalledTimes(1);
      expect(getEXIFSpy).toHaveBeenCalledWith("url1");
      // Should not be called for non-image mime
      expect(getEXIFSpy).not.toHaveBeenCalledWith("url2");
    });
  });
});
