import imageTypeFn from "image-type";
import Log from "logger";
import bytes from "bytes";
import { OneDriveMediaItem } from "../../types/type";
import { fetchToArrayBuffer } from "./functions/fetchItem";
import { convertHEIC } from "./functions/photosConverter";

class FileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileError";
  }
}

const isJpgFn = (buffer: ArrayBuffer) => {
  if (!buffer || buffer.byteLength < 3) {
    return false;
  }

  const view = new Uint8Array(buffer);
  return view[0] === 255
    && view[1] === 216
    && view[2] === 255;
};

export const urlToImageBase64 = async (photo: OneDriveMediaItem, size: { width: number; height: number }) => {

  let memory = process.memoryUsage();
  Log.debug(`[MMM-OneDrive] [rss] 3-1 rss=${bytes(memory.rss)}`);

  let photoArrayBuffer = await fetchToArrayBuffer(photo.baseUrl);

  memory = process.memoryUsage();
  Log.debug(`[MMM-OneDrive] [rss] 3-2 rss=${bytes(memory.rss)}`);

  const imageType = await imageTypeFn(photoArrayBuffer);

  memory = process.memoryUsage();
  Log.debug(`[MMM-OneDrive] [rss] 3-3 rss=${bytes(memory.rss)}`);

  if (!imageType) {
    throw new FileError(`Could not determine image type for ${photo.filename}`);
  }
  Log.debug(`[MMM-OneDrive] [urlToImageBase64] Image type: ${imageType.ext}, mimeType: ${imageType.mime}`);

  memory = process.memoryUsage();
  Log.debug(`[MMM-OneDrive] [rss] 3-4 rss=${bytes(memory.rss)}`);

  if (imageType.ext === "heic") {
    photoArrayBuffer = await convertHEIC({ filename: photo.filename, data: photoArrayBuffer, size });
    const isJpg = isJpgFn(photoArrayBuffer);
    if (!isJpg) {
      throw new FileError(`The output of convertHEIC is not a valid JPG:
                ${photo.filename}, mimeType: ${photo.mimeType}, url: ${photo.baseUrl}`);
    }
  }

  memory = process.memoryUsage();
  Log.debug(`[MMM-OneDrive] [rss] 3-5 rss=${bytes(memory.rss)}`);

  const base64 = Buffer.from(photoArrayBuffer).toString("base64");

  photoArrayBuffer = null;

  memory = process.memoryUsage();
  Log.debug(`[MMM-OneDrive] [rss] 3-6 rss=${bytes(memory.rss)}`);
  return base64;
};