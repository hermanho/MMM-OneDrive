import { describe, expect, it, beforeEach, jest, afterEach } from "@jest/globals";
import nodeHelperObj from "./node_helper.js";
import logLevel from "./tests/logger.mock";
import type { OneDriveMediaItem } from "./types/type";

const createMockOneDrivePhotos = (num: number) => Array(num).fill({}).map((_, i) => ({ id: "photo" + i, mediaMetadata: { dateTimeOriginal: new Date().toISOString() } } as OneDriveMediaItem));

jest.mock("./OneDrivePhotos.js", () =>
  jest.fn(() => ({
    batchRequestRefresh: jest.fn((arr) => Promise.resolve(arr)),
    on: jest.fn(),
    getAlbums: async () => [],
    getAlbumThumbnail: async () => "mock-thumbnail-url",
    getImageFromAlbum: async (id: string) => Promise.resolve(createMockOneDrivePhotos(10).map((photo) => ({ ...photo, albumId: "album" + id }))),
  }))
);

describe("nodeHelperObj", () => {
  let helper: InstanceType<typeof nodeHelperObj>;
  beforeEach(async () => {
    helper = new nodeHelperObj();
    // Provide a minimal config for initializeAfterLoading
    const config = { albums: [], updateInterval: 60000, sort: "new", condition: {}, showWidth: 1080, showHeight: 1920, timeFormat: "YYYY/MM/DD HH:mm", forceAuthInteractive: false };
    helper.readFileSafe = jest.fn(() => Promise.resolve(""));
    helper.writeFileSafe = jest.fn(() => Promise.resolve());
    helper.saveCacheConfig = jest.fn(() => Promise.resolve());
    helper.sendSocketNotification = jest.fn(() => Promise.resolve());
    const mockTryToIntitialize = jest.fn(() => Promise.resolve()) as any;
    mockTryToIntitialize.initializeTimer = null;
    helper.tryToIntitialize = mockTryToIntitialize;
    await helper.initializeAfterLoading(config);
    helper.localPhotoList = createMockOneDrivePhotos(10);
    helper.localPhotoPntr = 0;
    helper.lastLocalPhotoPntr = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    helper?.stop();
    helper = null;
  });


  describe("getImageList", () => {
    it("should increase localPhotoPntr after getImageList call", async () => {
      helper.localPhotoList = createMockOneDrivePhotos(20);
      helper.selecetedAlbums = Array(10).fill({}).map((_, i) => ({ id: "album" + i, title: "album" + i }));
      await helper.prepAndSendChunk(7);
      expect(helper.localPhotoPntr).toBeLessThanOrEqual(helper.localPhotoList.length);
      expect(helper.lastLocalPhotoPntr).toBe(0);
      expect(helper.localPhotoPntr).toBe(7);
      await helper.prepAndSendChunk(7);
      expect(helper.lastLocalPhotoPntr).toBe(7);
      expect(helper.localPhotoPntr).toBe(14);
      await helper.getImageList();
      expect(helper.localPhotoList.length).toBe(100);
      expect(helper.lastLocalPhotoPntr).toBe(14);
      expect(helper.localPhotoPntr).toBe(34);
    });
  });

  describe("prepAndSendChunk", () => {
    it("should reset lastLocalPhotoPntr, localPhotoPntr if out of bounds and not loop endlessly", async () => {
      await helper.prepAndSendChunk(5);
      expect(helper.localPhotoPntr).toBeLessThanOrEqual(helper.localPhotoList.length);
      expect(helper.lastLocalPhotoPntr).toBe(0);
      expect(helper.localPhotoPntr).toBe(5);
      expect(logLevel.info).toHaveBeenCalledWith("[ONEDRIVE] [node_helper]", "prepAndSendChunk done");
    });

    it("should reset lastLocalPhotoPntr, localPhotoPntr from 0 with remaining", async () => {
      helper.localPhotoList = createMockOneDrivePhotos(19);
      helper.localPhotoPntr = 100; // Out of bounds
      helper.lastLocalPhotoPntr = 0;
      await helper.prepAndSendChunk(7);
      expect(helper.localPhotoPntr).toBeLessThanOrEqual(helper.localPhotoList.length);
      expect(helper.lastLocalPhotoPntr).toBe(0);
      expect(helper.localPhotoPntr).toBe(7);
      await helper.prepAndSendChunk(7);
      expect(helper.localPhotoPntr).toBeLessThanOrEqual(helper.localPhotoList.length);
      expect(helper.lastLocalPhotoPntr).toBe(7);
      expect(helper.localPhotoPntr).toBe(14);
      await helper.prepAndSendChunk(7);
      expect(helper.localPhotoPntr).toBeLessThanOrEqual(helper.localPhotoList.length);
      expect(helper.lastLocalPhotoPntr).toBe(14);
      expect(helper.localPhotoPntr).toBe(19);
      await helper.prepAndSendChunk(7);
      expect(helper.localPhotoPntr).toBeLessThanOrEqual(helper.localPhotoList.length);
      expect(helper.lastLocalPhotoPntr).toBe(0);
      expect(helper.localPhotoPntr).toBe(7);
    });

    it("should handle localPhotoPntr < 0", async () => {
      helper.localPhotoPntr = -10;
      await helper.prepAndSendChunk(5);
      expect(helper.localPhotoPntr).toBeLessThanOrEqual(helper.localPhotoList.length);
      expect(helper.lastLocalPhotoPntr).toBe(0);
    });

    it("should not call batchRequestRefresh if no items to refresh", async () => {
      helper.localPhotoList = [];
      helper.localPhotoPntr = 0;
      await helper.prepAndSendChunk(5);
      expect(logLevel.error).toHaveBeenCalledWith("[ONEDRIVE] [node_helper]", "couldn't send ", 0, " pics");
    });
  });
});
