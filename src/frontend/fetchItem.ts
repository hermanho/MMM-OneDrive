export const fetchToUint8Array = async (url: string): Promise<Uint8Array> => {
  const resp = await fetch(url);
  const arrayBuffer = await resp.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  return buffer;
};