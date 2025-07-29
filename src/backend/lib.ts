import imageTypeFn from "image-type";
import Log from "logger";
import { OneDriveMediaItem } from "../../types/type";
import { fetchToArrayBuffer } from "./fetchItem";
import { convertHEIC } from "./photosConverter";

class FileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileError";
  }
}

const isJpgFn = <T>(buffer: ArrayLike<T>) => {
  if (!buffer || buffer.length < 3) {
    return false;
  }

  return buffer[0] === 255
    && buffer[1] === 216
    && buffer[2] === 255;
};

export const urlToImageBase64 = async (photo: OneDriveMediaItem, size: { width: number; height: number }) => {
  const arrayBuf = await fetchToArrayBuffer(photo.baseUrl);
  const imageType = await imageTypeFn(arrayBuf);
  if (!imageType) {
    throw new FileError(`Could not determine image type for ${photo.filename}`);
  }
  Log.debug(`[MMM-OneDrive] [urlToImageBase64] Image type: ${imageType.ext}, mimeType: ${imageType.mime}`);

  let buffer: Buffer<ArrayBufferLike> = Buffer.from(arrayBuf);
  if (imageType.ext === "heic") {
    buffer = await convertHEIC({ filename: photo.filename, arrayBuffer: arrayBuf, size });
    const isJpg = isJpgFn(buffer);
    if (!isJpg) {
      throw new FileError(`The output of convertHEIC is not a valid JPG:
                ${photo.filename}, mimeType: ${photo.mimeType}, url: ${photo.baseUrl}`);
    }
  }

  const base64 = buffer.toString("base64");
  return base64;
};