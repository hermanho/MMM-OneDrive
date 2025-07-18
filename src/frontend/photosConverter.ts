import convert from "heic-convert/browser";
import { fetchToUint8Array } from "./fetchItem";

interface ConvertHEICParams {
  id: string;
  filename: string;
  url: string;
}

export const convertHEIC = async ({ id, filename, url }: ConvertHEICParams) => {
  console.debug("[MMM-OneDrive] convertHEIC", { id, filename, url });
  const inputBuffer = await fetchToUint8Array(url);
  try {
    const d = new Date().getTime();
    const outputBuffer = await convert({
      buffer: inputBuffer, // the HEIC file buffer
      format: "JPEG",      // output format
      quality: 0.8,           // the jpeg compression quality, between 0 and 1
    });
    console.debug("[MMM-OneDrive] convertHEIC done", { duration: (new Date().getTime() - d) });
    return outputBuffer;
  } catch (err) {
    console.error("[MMM-OneDrive] Error in convertHEIC", { id, filename, url });
    console.error(err?.stack || err);
    throw err;
  }
};

