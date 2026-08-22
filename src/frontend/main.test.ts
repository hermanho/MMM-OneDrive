(global as any).Module = {
  definitions: {},
  register(name: string, definition: any) {
    this.definitions[name] = definition;
  },
};
(global as any).document = {};

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import "./main";
import type { OneDriveMediaItem } from "../../types/type";
import type { DriveItem } from "@microsoft/microsoft-graph-types";

class MockElement {
  id = "";
  style: Record<string, any> & { setProperty: (name: string, value: string) => void };
  innerHTML = "";
  textContent = "";
  children: MockElement[] = [];
  removed = false;
  src = "";
  listeners: Record<string, Array<() => void>> = {};
  classList: {
    add: (...names: string[]) => void;
    remove: (...names: string[]) => void;
    contains: (name: string) => boolean;
  };

  private readonly classNames = new Set<string>();

  constructor(
    public readonly tagName: string,
    private readonly doc: MockDocument,
  ) {
    this.style = {
      setProperty: (name: string, value: string) => {
        this.style[name] = value;
      },
    };
    this.classList = {
      add: (...names: string[]) => {
        names.forEach((name) => this.classNames.add(name));
      },
      remove: (...names: string[]) => {
        names.forEach((name) => this.classNames.delete(name));
      },
      contains: (name: string) => this.classNames.has(name),
    };
  }

  appendChild(child: MockElement) {
    this.children.push(child);
    this.doc.registerElement(child);
    return child;
  }

  addEventListener(event: string, callback: () => void) {
    this.listeners[event] ??= [];
    this.listeners[event].push(callback);
  }

  dispatch(event: string) {
    for (const callback of this.listeners[event] ?? []) {
      callback();
    }
  }

  querySelectorAll(selector: string) {
    if (selector !== "img") {
      return [];
    }

    const matches: MockElement[] = [];
    const walk = (node: MockElement) => {
      for (const child of node.children) {
        if (child.tagName === "img") {
          matches.push(child);
        }
        walk(child);
      }
    };

    walk(this);
    return matches;
  }

  remove() {
    this.removed = true;
  }
}

class MockDocument {
  private readonly elements = new Map<string, MockElement>();

  createElement(tagName: string) {
    return new MockElement(tagName, this);
  }

  getElementById(id: string) {
    return this.elements.get(id) ?? null;
  }

  registerElement(element: MockElement) {
    if (element.id) {
      this.elements.set(element.id, element);
    }
  }
}

const moduleDefinition = (global as any).Module.definitions["MMM-OneDrive"];

const createPhoto = (overrides: Partial<OneDriveMediaItem> = {}): OneDriveMediaItem => ({
  id: "photo-1",
  baseUrl: "https://example.com/photo.jpg",
  mimeType: "image/jpeg",
  mediaMetadata: {
    dateTimeOriginal: "2024-01-02T03:04:05.000Z",
    manualExtractEXIF: null,
    width: "1920",
    height: "1080",
    photo: {},
  },
  parentReference: {
    driveId: "drive-id",
    driveType: "personal",
    id: "parent-id",
    name: "Pictures",
    path: "/drive/root:/Pictures",
  },
  filename: "photo.jpg",
  _albumId: "album-1",
  _albumTitle: "Vacation",
  _indexOfPhotos: 4,
  ...overrides,
});

const createAlbum = (overrides: Partial<DriveItem> = {}): DriveItem => ({
  id: "album-1",
  name: "Vacation",
  ...overrides,
});

const createModuleInstance = (configOverrides: Record<string, unknown> = {}) => ({
  ...moduleDefinition,
  config: {
    albums: [],
    updateInterval: 1000 * 30,
    sort: "new",
    condition: {},
    showWidth: 1080,
    showHeight: 1920,
    timeFormat: "YYYY/MM/DD HH:mm",
    autoInfoPosition: false,
    ...configOverrides,
  },
  data: { position: "top_left" },
  sendSocketNotification: jest.fn(),
  cleanUpPresentPhotoMemory: jest.fn(),
  cleanUpAlbumCoverMemory: jest.fn(),
});

describe("main.ts", () => {
  beforeEach(() => {
    (global as any).document = new MockDocument();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("starts with normalized config and transforms RegExp albums for INIT", () => {
    const instance = createModuleInstance({
      updateInterval: 1000,
      albums: ["camera", /favorites/gi],
      condition: { minWidth: 400 },
    });

    instance.start();

    expect(instance.firstScan).toBe(true);
    expect(instance.dynamicPosition).toBe(0);
    expect(instance.config.updateInterval).toBe(1000 * 10);
    expect(instance.config.condition).toEqual({
      ...moduleDefinition.defaults.condition,
      minWidth: 400,
    });
    expect(instance.sendSocketNotification).toHaveBeenCalledWith("INIT", expect.objectContaining({
      albums: ["camera", { source: "favorites", flags: "gi" }],
    }));
  });

  it("delegates RENDER_PHOTO socket notifications to render and stores state", () => {
    const instance = createModuleInstance();
    instance.render = jest.fn();
    const payload = {
      photo: createPhoto(),
      album: createAlbum(),
      url: "https://example.com/photo.jpg",
    };

    instance.socketNotificationReceived("RENDER_PHOTO", payload);

    expect(instance.state).toEqual({ type: "newPhoto", payload });
    expect(instance.render).toHaveBeenCalledWith(payload.url, payload.photo, payload.album);
  });

  it("requests the next photo when ONEDRIVE_PHOTO_NEXT is received", () => {
    const instance = createModuleInstance();

    instance.notificationReceived("ONEDRIVE_PHOTO_NEXT", undefined, undefined);

    expect(instance.sendSocketNotification).toHaveBeenCalledWith("NEXT_PHOTO", []);
  });

  it("builds the DOM wrapper with configured dimensions and clears animation class", () => {
    const instance = createModuleInstance({
      showWidth: 800,
      showHeight: 600,
    });

    const wrapper = instance.getDom();
    const current = (global as any).document.getElementById("ONEDRIVE_PHOTO_CURRENT");
    const statusMessage = (global as any).document.getElementById("ONEDRIVE_PHOTO_STATUS");

    expect(wrapper.id).toBe("ONEDRIVE_PHOTO");
    expect(wrapper.style.width).toBe("800px");
    expect(wrapper.style.height).toBe("600px");
    expect(statusMessage?.innerHTML).toBe("Loading...");

    current?.classList.add("animated");
    current?.dispatch("animationend");
    expect(current?.classList.contains("animated")).toBe(false);
  });

  it("suspends and resumes the module while updating status output", () => {
    const instance = createModuleInstance();
    const doc = (global as any).document as MockDocument;
    const statusMessage = doc.createElement("div");
    statusMessage.id = "ONEDRIVE_PHOTO_STATUS";
    statusMessage.innerHTML = "Loading...";
    doc.registerElement(statusMessage);

    instance.suspend();

    expect(instance.suspended).toBe(true);
    expect(instance.sendSocketNotification).toHaveBeenCalledWith("MODULE_SUSPENDED", undefined);
    expect(instance.cleanUpPresentPhotoMemory).toHaveBeenCalled();
    expect(instance.cleanUpAlbumCoverMemory).toHaveBeenCalled();
    expect(statusMessage.innerHTML).toBe("");

    instance.resume();

    expect(instance.suspended).toBe(false);
    expect(instance.sendSocketNotification).toHaveBeenCalledWith("MODULE_RESUMED", undefined);
  });

  it("skips render work while suspended", () => {
    const instance = createModuleInstance();
    instance.suspended = true;

    instance.render("https://example.com/photo.jpg", createPhoto(), createAlbum());

    expect(instance.cleanUpPresentPhotoMemory).not.toHaveBeenCalled();
    expect(instance.cleanUpAlbumCoverMemory).not.toHaveBeenCalled();
    expect(instance.sendSocketNotification).not.toHaveBeenCalled();
  });
});
