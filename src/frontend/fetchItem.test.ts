import { describe, expect, it, jest } from "@jest/globals";
import { fetchToUint8Array } from "./fetchItem";

describe("fetchToUint8Array", () => {
  it("should fetch a URL and return a Uint8Array", async () => {
    // Mock fetch
    const mockData = new Uint8Array([1, 2, 3, 4]);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(mockData.buffer),
      } as Response),
    );

    const url = "https://example.com/data";
    const result = await fetchToUint8Array(url);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([1, 2, 3, 4]);
    expect(global.fetch).toHaveBeenCalledWith(url);
  });
});
