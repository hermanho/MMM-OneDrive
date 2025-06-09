import convert from 'heic-convert/browser';

declare const Log: any

interface ConvertHEICParams {
  id: string;
  filename: string;
  url: string;
}

export const convertHEIC = async ({ id, filename, url }: ConvertHEICParams) => {
  try {
    Log.debug('convertHEIC', { id, filename, url });
    const d = new Date().valueOf();
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const inputBuffer = new Uint8Array(arrayBuffer);
    const outputBuffer = await convert({
      buffer: inputBuffer, // the HEIC file buffer
      format: 'JPEG',      // output format
      quality: 0.8,           // the jpeg compression quality, between 0 and 1
    });
    Log.debug('convertHEIC done', { time: (new Date().valueOf() - d) });
    return outputBuffer;
  } catch (err) {
    console.error('Error in convertHEIC', { id, filename, url });
    console.error(err?.stack || err);
    throw err;
  }
};

