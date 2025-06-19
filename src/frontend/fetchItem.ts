// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const newrelic: any;

const fetchToUint8ArrayOnce = async (url: string): Promise<Uint8Array> => {
  const resp = await fetch(url);
  if (!resp.ok) {
    let text = "";
    try {
      text = await resp.text();
    } catch {
      // Ignore errors while reading the response text
    }
    throw new Error(`Failed to fetch url ${url}: ${resp.status}`, { cause: text });
  }
  const arrayBuffer = await resp.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  return buffer;
};

export const fetchToUint8Array = async (url: string, maxRetries = 3, retryDelay = 500): Promise<Uint8Array> => {
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
      console.error(`Error fetching ${url}:`);
      console.error(err);
      newrelic?.noticeError(err);
      throw err;
    }
  }
  throw new Error(`Failed to fetch url ${url} after ${maxRetries} attempts.`);
};