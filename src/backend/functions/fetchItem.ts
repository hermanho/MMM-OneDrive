import sleep from "./sleep";

export class FetchHTTPError extends Error {
  public cause: string;
  public url: string;
  public status: number;
  public responseText: string;

  constructor(url: string, status: number, responseText: string) {
    super(`Failed to fetch url ${url}: ${status}, ${responseText}`);
    this.name = "FetchHTTPError";
    this.cause = responseText;
    this.url = url;
    this.status = status;
    this.responseText = responseText;
  }
}

/**
 * Fetch a URL and return the response as an ArrayBuffer.
 */
const fetchToArrayBufferOnce = async (url: string) => {
  const resp = await fetch(url);
  if (!resp.ok) {
    let text = "";
    try {
      text = await resp.text();
    } catch {
      // Ignore errors while reading the response text
    }
    throw new FetchHTTPError(url, resp.status, text);
  }
  const arrayBuffer = await resp.arrayBuffer();
  return arrayBuffer;
};

/**
 * Fetch a URL and return the response as an ArrayBuffer.
 */
export const fetchToArrayBuffer = async (url: string, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fetchToArrayBufferOnce(url);
    } catch (err) {
      console.error(`Error fetching ${url}:`);
      console.error(err);
      console.warn(`Retrying fetchToUint8Array for ${url}, retry count: ${attempt}`);
      const shouldRetry = [
        err instanceof TypeError && err.message.includes("Failed to fetch"),
        err instanceof FetchHTTPError,
      ].some(Boolean);
      if (!shouldRetry) {
        console.error(`Not retrying fetch for ${url} due to unknown error`);
        throw err;
      }
      attempt++;
      console.warn(`Fetch failed for ${url}, attempt ${attempt}/${maxRetries}.`);
      await sleep(2000);
    }
  }
  console.error(`Failed to fetch ${url} after ${maxRetries} attempts.`);
  throw new Error(`Failed to fetch url ${url} after ${maxRetries} attempts.`);
};
