import imageTypeFn from "image-type";
import Log from "logger";
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

  let photoArrayBuffer = await fetchToArrayBuffer(photo.baseUrl);
  const imageType = await imageTypeFn(photoArrayBuffer);
  if (!imageType) {
    throw new FileError(`Could not determine image type for ${photo.filename}`);
  }
  Log.debug(`[MMM-OneDrive] [urlToImageBase64] Image type: ${imageType.ext}, mimeType: ${imageType.mime}`);

  if (imageType.ext === "heic") {
    photoArrayBuffer = await convertHEIC({ filename: photo.filename, data: photoArrayBuffer, size });
    const isJpg = isJpgFn(photoArrayBuffer);
    if (!isJpg) {
      throw new FileError(`The output of convertHEIC is not a valid JPG:
                ${photo.filename}, mimeType: ${photo.mimeType}, url: ${photo.baseUrl}`);
    }
  }

  const base64 = Buffer.from(photoArrayBuffer).toString("base64");
  photoArrayBuffer = null;
  return base64;
};