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
 * @param {number} maxRetries - The maximum number of retry attempts.
 * @param {number} retryDelay - The delay between retry attempts in milliseconds.
 * @returns {Promise<Uint8Array>} - The response data as a Uint8Array.
 */
const fetchToUint8Array = async (url, maxRetries = 3, retryDelay = 500) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fetchToUint8ArrayOnce(url);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        attempt++;
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, retryDelay));
          continue;
        }
      }
      if (err instanceof FetchHTTPError && err.status >= 400 && err.status < 500) {
        // If it's a client error (4xx), we don't retry
        throw err;
      }
      console.error(`Error fetching ${url}:`);
      console.error(err);
      throw err;
    }
  }
  throw new Error(`Failed to fetch url ${url} after ${maxRetries} attempts.`);
};

module.exports = {
  FetchHTTPError,
  fetchToUint8Array,
};