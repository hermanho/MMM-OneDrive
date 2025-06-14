export const fetchToUint8Array = async (url: string): Promise<Uint8Array> => {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`, { cause: await resp.text() });
  }
  const arrayBuffer = await resp.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  return buffer;
};