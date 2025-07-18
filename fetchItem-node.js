const sleep = require("./sleep");

class FetchHTTPError extends Error {
  constructor(url, status, responseText) {
    super(`Failed to fetch url ${url}: ${status}, ${responseText}`);
    this.cause = responseText;
    this.url = url;
    this.status = status;
    this.responseText = responseText;
  }
}

/**
 * Fetch a URL and return the response as a Uint8Array.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<Uint8Array>} - The response data as a Uint8Array.
 */
const fetchToUint8ArrayOnce = async (url) => {
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
 * Fetch a URL and return the response as a Uint8Array.
 * @param {string} url - The URL to fetch.
 * @param maxRetries
 * @returns {Promise<Uint8Array>} - The response data as a Uint8Array.
 */
const fetchToUint8Array = async (url, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fetchToUint8ArrayOnce(url);
    } catch (err) {
      console.error(`Error fetching ${url}:`);
      console.error(err);
      console.warn("Retrying fetchToUint8Array, retry count:", attempt);
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

module.exports = {
  FetchHTTPError,
  fetchToUint8Array,
};