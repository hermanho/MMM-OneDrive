import { describe, expect, it, jest } from "@jest/globals";
import { fetchToUint8Array } from "./fetchItem";

describe("fetchToUint8Array", () => {
  it("should fetch a URL and return a Uint8Array", async () => {
    // Mock fetch
    const mockData = new Uint8Array([1, 2, 3, 4]);
    (global.fetch as any) = jest.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(mockData.buffer),
      } as any),
    );

    const url = "https://example.com/data";
    const result = await fetchToUint8Array(url);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([1, 2, 3, 4]);
    expect(global.fetch).toHaveBeenCalledWith(url);
  });

  it("should retry on TypeError with 'Failed to fetch' and eventually succeed", async () => {
    const mockData = new Uint8Array([5, 6, 7, 8]);
    const error = new TypeError("Failed to fetch");
    const fetchMock = jest.fn()
      // @ts-expect-error: Jest mock type mismatch for mockRejectedValueOnce
      .mockRejectedValueOnce(error)
      // @ts-expect-error: Jest mock type mismatch for mockRejectedValueOnce
      .mockRejectedValueOnce(error)
      // @ts-expect-error: Jest mock type mismatch for mockResolvedValue
      .mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockData.buffer),
      });
    (global.fetch as any) = fetchMock;

    const url = "https://example.com/retry";
    const result = await fetchToUint8Array(url, 3, 10); // use short delay for test
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([5, 6, 7, 8]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
