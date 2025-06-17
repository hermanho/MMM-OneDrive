export const fetchToUint8Array = async (url: string): Promise<Uint8Array> => {
  try {
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
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};