(global as any).Module = {
  definitions: {},
  register: function (name: string, definition: any) {
    this.definitions[name] = definition;
  },
};
(global as any).document = {}; // <-- Add this line to mock document

import { describe, it, beforeEach, expect, jest, afterEach } from "@jest/globals";
import "./main";
import { OneDriveMediaItem } from "../../types/type";

describe("main.ts", () => {

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("updatePhotos", () => {
    let instance: any;
    let sendSocketNotification: jest.Mock;
    let render: jest.Mock;
    let ready: jest.Mock;

    beforeEach(() => {
      // Ensure document exists and mock getElementById before each test
      if (!(global as any).document) (global as any).document = {};
      (global as any).document.getElementById = jest.fn(() => ({
        innerHTML: "",
        textContent: "",
        style: {},
        appendChild: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
      }));
      instance = (global as any).Module.definitions["MMM-OneDrive"];
      sendSocketNotification = jest.fn();
      render = jest.fn();
      ready = jest.fn();
      instance.sendSocketNotification = sendSocketNotification;
      instance.render = render;
      instance.ready = ready;
      instance.config = { timeFormat: "YYYY/MM/DD HH:mm" };
      instance.needMorePicsFlag = false;
      instance.suspended = false;
    });

    it("should increment index after showing a photo and reset if index exceeds scanned.length", () => {
      instance.scanned = [
        { id: "1", mimeType: "image/jpeg", baseUrl: "url1" },
        { id: "2", mimeType: "image/jpeg", baseUrl: "url2" },
        { id: "3", mimeType: "image/jpeg", baseUrl: "url3" },
      ] as Partial<OneDriveMediaItem>[];
      instance.index = 2; // last item
      instance.updatePhotos();
      // After showing, index should increment to 3, then reset to 0 and set needMorePicsFlag
      expect(instance.index).toBe(0);
      expect(instance.needMorePicsFlag).toBe(true);
      expect(ready).toHaveBeenCalledWith("url3", expect.objectContaining({ id: "3" }));
    });

    it("should increment index after showing a photo and not reset if index is within bounds", () => {
      instance.scanned = [
        { id: "1", mimeType: "image/jpeg", baseUrl: "url1" },
        { id: "2", mimeType: "image/jpeg", baseUrl: "url2" },
        { id: "3", mimeType: "image/jpeg", baseUrl: "url3" },
      ];
      instance.index = 1;
      instance.needMorePicsFlag = false;
      instance.updatePhotos();
      // After showing, index should increment to 2 and not reset
      expect(instance.index).toBe(2);
      expect(instance.needMorePicsFlag).toBe(false);
      expect(ready).toHaveBeenCalledWith("url2", expect.objectContaining({ id: "2" }));
    });

    it("should skip expired baseUrlExpireDateTime items and show the next valid photo", () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 10000).toISOString(); // Date type
      const valid = new Date(now.getTime() + 100000).toISOString(); // Date type
      instance.scanned = [
        { id: "1", mimeType: "image/jpeg", baseUrl: "url1", baseUrlExpireDateTime: expired },
        { id: "2", mimeType: "image/jpeg", baseUrl: "url2", baseUrlExpireDateTime: valid },
        { id: "3", mimeType: "image/jpeg", baseUrl: "url3", baseUrlExpireDateTime: expired },
      ] as Partial<OneDriveMediaItem>[];
      instance.index = 0;
      instance.needMorePicsFlag = false;
      instance.updatePhotos();
      // Should skip first (expired) and show the second (valid)
      expect(instance.index).toBe(2); // incremented after showing index 1
      expect(instance.needMorePicsFlag).toBe(false);
      expect(ready).toHaveBeenCalledWith("url2", expect.objectContaining({ id: "2" }));
    });

    it("should wrap and set needMorePicsFlag if all baseUrlExpireDateTime are expired", () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 10000).toISOString(); // Date type
      instance.scanned = [
        { id: "1", mimeType: "image/jpeg", baseUrl: "url1", baseUrlExpireDateTime: expired },
        { id: "2", mimeType: "image/jpeg", baseUrl: "url2", baseUrlExpireDateTime: expired },
      ] as Partial<OneDriveMediaItem>[];
      instance.index = 0;
      instance.needMorePicsFlag = false;
      jest.useFakeTimers();
      instance.updatePhotos();
      // Should not call ready, should set needMorePicsFlag and schedule NEED_MORE_PICS
      expect(ready).not.toHaveBeenCalled();
      expect(instance.needMorePicsFlag).toBe(true);
      jest.runAllTimers();
      expect(sendSocketNotification).toHaveBeenCalledWith("NEED_MORE_PICS", []);
      jest.useRealTimers();
    });

    it("should handle mixed array where some items have baseUrlExpireDateTime and some do not", () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 10000); // Date type
      const valid = new Date(now.getTime() + 100000); // Date type
      instance.scanned = [
        { id: "1", mimeType: "image/jpeg", baseUrl: "url1", baseUrlExpireDateTime: expired }, // expired
        { id: "2", mimeType: "image/jpeg", baseUrl: "url2" }, // no baseUrlExpireDateTime, always valid
        { id: "3", mimeType: "image/jpeg", baseUrl: "url3", baseUrlExpireDateTime: valid }, // valid
        { id: "4", mimeType: "image/jpeg", baseUrl: "url4", baseUrlExpireDateTime: expired }, // expired
        { id: "5", mimeType: "image/jpeg", baseUrl: "url5" }, // no baseUrlExpireDateTime, always valid
      ];
      instance.index = 0;
      instance.needMorePicsFlag = false;
      // Should skip first (expired) and show the second (no expire, valid)
      instance.updatePhotos();
      expect(instance.index).toBe(2);
      expect(instance.needMorePicsFlag).toBe(false);
      expect(ready).toHaveBeenCalledWith("url2", expect.objectContaining({ id: "2" }));
      // Next: should show third (valid)
      instance.updatePhotos();
      expect(instance.index).toBe(3);
      expect(instance.needMorePicsFlag).toBe(false);
      expect(ready).toHaveBeenCalledWith("url3", expect.objectContaining({ id: "3" }));
      // Next: should skip fourth (expired) and show fifth (no expire, valid)
      instance.updatePhotos();
      expect(instance.index).toBe(0);
      expect(instance.needMorePicsFlag).toBe(true);
      expect(ready).toHaveBeenCalledWith("url5", expect.objectContaining({ id: "5" }));
    });
  });
});
