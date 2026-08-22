import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import nodeHelperObj from "./node_helper.js";
import type { OneDriveMediaItem } from "./types/type";

const mockGetImageFromAlbum: any = jest.fn();
const mockRefreshItem: any = jest.fn();

jest.mock("./lib/OneDrivePhotos.js", () => ({
  OneDrivePhotos: jest.fn(() => ({
    on: jest.fn(),
    getAlbums: jest.fn(() => Promise.resolve([])),
    getAlbumThumbnail: jest.fn(() => Promise.resolve("mock-thumbnail-url")),
    getImageFromAlbum: mockGetImageFromAlbum,
    refreshItem: mockRefreshItem,
  })),
}));

jest.mock("./lib/lib", () => ({
  createDirIfNotExists: jest.fn(),
  createIntervalRunner: jest.fn(() => ({
    skipToNext: jest.fn(),
    stop: jest.fn(),
    resume: jest.fn(),
  })),
  internetStatusListener: { on: jest.fn() },
  urlToDisk: jest.fn(() => Promise.resolve(2048)),
}));

const { createIntervalRunner: mockCreateIntervalRunner, urlToDisk: mockUrlToDisk } = jest.requireMock("./lib/lib") as {
  createIntervalRunner: any;
  urlToDisk: any;
};

const createMockPhoto = (overrides: Partial<OneDriveMediaItem> = {}): OneDriveMediaItem => ({
  id: "photo-1",
  baseUrl: "https://example.com/photo.jpg",
  baseUrlExpireDateTime: new Date(Date.now() + 60_000).toISOString(),
  mimeType: "image/jpeg",
  mediaMetadata: {
    dateTimeOriginal: "2024-01-01T00:00:00.000Z",
    manualExtractEXIF: null,
    width: "1920",
    height: "1080",
    photo: {},
  },
  parentReference: {
    driveId: "drive-1",
    driveType: "personal",
    id: "parent-1",
    name: "Pictures",
    path: "/drive/root:/Pictures",
  },
  filename: "photo.jpg",
  _albumId: "album-1",
  _albumTitle: "Album 1",
  _indexOfPhotos: 0,
  ...overrides,
});

describe("node_helper.js", () => {
  let helper: InstanceType<typeof nodeHelperObj>;

  beforeEach(async () => {
    mockGetImageFromAlbum.mockReset();
    mockRefreshItem.mockReset();
    mockCreateIntervalRunner.mockClear();
    mockUrlToDisk.mockClear();

    helper = new nodeHelperObj();
    helper.name = "MMM-OneDrive";
    helper.path = process.cwd();
    helper.sendSocketNotification = jest.fn();
    helper.readFileSafe = jest.fn(() => Promise.resolve(""));
    helper.writeFileSafe = jest.fn(() => Promise.resolve());
    helper.saveCacheConfig = jest.fn(() => Promise.resolve());
    helper.tryToIntitialize = jest.fn(() => Promise.resolve());

    const config = {
      albums: [],
      updateInterval: 60_000,
      sort: "new",
      condition: {},
      showWidth: 1080,
      showHeight: 1920,
      timeFormat: "YYYY/MM/DD HH:mm",
      autoInfoPosition: false,
    };

    await helper.initializeAfterLoading(config as any);
    helper.selectedAlbums = [{ id: "album-1", name: "Album 1" } as any];
    jest.clearAllMocks();
  });

  afterEach(() => {
    helper?.stop();
    jest.clearAllMocks();
  });

  it("getImageList sorts newest first and resets photoRefreshPointer when out of range", async () => {
    mockGetImageFromAlbum.mockImplementation((albumId: string, validator?: (item: OneDriveMediaItem) => boolean) => {
      const items = [
        createMockPhoto({ id: `${albumId}-old`, mediaMetadata: { dateTimeOriginal: "2024-01-01T00:00:00.000Z", width: "1920", height: "1080", photo: {}, manualExtractEXIF: null } as any }),
        createMockPhoto({ id: `${albumId}-new`, mediaMetadata: { dateTimeOriginal: "2024-02-01T00:00:00.000Z", width: "1920", height: "1080", photo: {}, manualExtractEXIF: null } as any }),
      ];
      return Promise.resolve(typeof validator === "function" ? items.filter(validator) : items);
    });

    helper.selectedAlbums = [
      { id: "album-1", name: "Album 1" },
      { id: "album-2", name: "Album 2" },
    ] as any;
    helper.photoRefreshPointer = 99;

    await helper.getImageList();

    expect(helper.localPhotoList).toHaveLength(4);
    expect(helper.localPhotoList.map((photo) => photo._indexOfPhotos)).toEqual([0, 1, 2, 3]);
    expect(helper.localPhotoList[0].id).toContain("new");
    expect(helper.photoRefreshPointer).toBe(0);
  });

  it("getImageList applies configured filters and excludes videos", async () => {
    helper.config.condition = {
      minWidth: 1000,
      minHeight: 700,
    };

    mockGetImageFromAlbum.mockImplementation((_albumId: string, validator?: (item: OneDriveMediaItem) => boolean) => {
      const items = [
        createMockPhoto({ id: "valid-1" }),
        createMockPhoto({ id: "too-small", mediaMetadata: { dateTimeOriginal: "2024-01-01T00:00:00.000Z", width: "800", height: "600", photo: {}, manualExtractEXIF: null } as any }),
        createMockPhoto({ id: "video-1", mimeType: "video/mp4" }),
      ];
      return Promise.resolve(typeof validator === "function" ? items.filter(validator) : items);
    });

    await helper.getImageList();

    expect(helper.localPhotoList).toHaveLength(1);
    expect(helper.localPhotoList[0].id).toBe("valid-1");
  });

  it("prepareShowPhoto sends RENDER_PHOTO with the cached module URL", async () => {
    helper.localPhotoList = [
      createMockPhoto({ id: "photo-1", filename: "My Photo.JPG", _albumId: "album-1" }),
    ];
    helper.selectedAlbums = [{ id: "album-1", name: "Album 1" } as any];

    const result = await helper.prepareShowPhoto({ photoId: "photo-1" });

    expect(result).toBe(true);
    expect(mockUrlToDisk.mock.calls[0][0]).toEqual(expect.objectContaining({ id: "photo-1" }));
    expect(mockUrlToDisk.mock.calls[0][1]).toEqual(expect.stringContaining("cache/photos/my photo.jpg-cache.jpg"));
    expect(helper.sendSocketNotification).toHaveBeenCalledWith("RENDER_PHOTO", expect.objectContaining({
      url: "modules/MMM-OneDrive/cache/photos/my%20photo.jpg-cache.jpg",
      album: expect.objectContaining({ id: "album-1" }),
    }));
  });

  it("prepareShowPhoto refreshes expired URLs before rendering", async () => {
    mockRefreshItem.mockResolvedValue({
      baseUrl: "https://example.com/refreshed.jpg",
      baseUrlExpireDateTime: new Date(Date.now() + 120_000).toISOString(),
    });

    const photo = createMockPhoto({
      id: "photo-expired",
      filename: "expired.jpg",
      baseUrl: "https://example.com/expired.jpg",
      baseUrlExpireDateTime: new Date(Date.now() - 60_000).toISOString(),
    });

    helper.localPhotoList = [photo];
    helper.selectedAlbums = [{ id: "album-1", name: "Album 1" } as any];

    const result = await helper.prepareShowPhoto({ photoId: "photo-expired" });

    expect(result).toBe(true);
    expect(mockRefreshItem).toHaveBeenCalledWith(photo);
    expect(photo.baseUrl).toBe("https://example.com/refreshed.jpg");
  });
});
