import convert from "heic-convert/browser";
import * as Log from "logger";

interface ConvertHEICParams {
  id: string;
  filename: string;
  url: string;
}

export const convertHEIC = async ({ id, filename, url }: ConvertHEICParams) => {
  try {
    Log.debug("[MMM-OneDrive] convertHEIC", { id, filename, url });
    const d = new Date().valueOf();
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const inputBuffer = new Uint8Array(arrayBuffer);
    const outputBuffer = await convert({
      buffer: inputBuffer, // the HEIC file buffer
      format: "JPEG",      // output format
      quality: 0.8,           // the jpeg compression quality, between 0 and 1
    });
    Log.debug("[MMM-OneDrive] convertHEIC done", { time: (new Date().valueOf() - d) });
    return outputBuffer;
  } catch (err) {
    console.error("[MMM-OneDrive] Error in convertHEIC", { id, filename, url });
    console.error(err?.stack || err);
    throw err;
  }
};

