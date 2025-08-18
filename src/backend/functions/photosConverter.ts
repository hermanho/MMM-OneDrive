/* eslint-disable @typescript-eslint/no-explicit-any */
import Log from "logger";
import sharp from "sharp";
import bytes from "bytes";
import { getLibheifFactory } from "./externals/libheifJS";

export interface ConvertHEICParams {
  filename: string;
  data: ArrayBuffer;
  size?: { width: number; height: number };
}

type HeifImageDisplay = {
  data: Uint8ClampedArray;
};


export const convertHEIC = async ({ filename, data, size }: ConvertHEICParams) => {
  let heifDecoder: any;
  let heifImages: any[] | undefined;

  let memory = process.memoryUsage();
  Log.debug(`[MMM-OneDrive] [rss] 4-1 rss=${bytes(memory.rss)}`);
  try {
    Log.debug("[MMM-OneDrive] [convertHEIC]", { filename });
    const d = Date.now();

    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-2 rss=${bytes(memory.rss)}`);
    const libheifFactory = await getLibheifFactory();
    heifDecoder = new libheifFactory.HeifDecoder();
    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-3 rss=${bytes(memory.rss)}`);

    heifImages = heifDecoder.decode(data);
    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-4 rss=${bytes(memory.rss)}`);

    if (!heifImages || heifImages.length === 0) {
      throw new Error(`No HEIF images found in ${filename}.`);
    }

    const heifImage = heifImages[0];
    const w = heifImage.get_width();
    const h = heifImage.get_height();

    const decodedData: HeifImageDisplay = await new Promise((resolve, reject) => {
      heifImage.display({ data: new Uint8ClampedArray(w * h * 4) }, (displayData: HeifImageDisplay) => {
        if (!displayData) {
          return reject(new Error("HEIF processing error"));
        }
        resolve(displayData);
      });
    });
    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-5 rss=${bytes(memory.rss)}`);

    const sharpBuffer = sharp(decodedData.data, {
      raw: {
        width: w,
        height: h,
        channels: 4,
      },
    });
    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-6 rss=${bytes(memory.rss)}`);

    const jpegData = await sharpBuffer
      .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
      .keepMetadata()
      .toBuffer();

    Log.debug("[MMM-OneDrive] [convertHEIC] Done", { duration: Date.now() - d, size: size !== undefined });

    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-7 rss=${bytes(memory.rss)}`);

    const outputArraybuffer = new ArrayBuffer(jpegData.byteLength);
    jpegData.copy(new Uint8Array(outputArraybuffer));
    return outputArraybuffer;
  } catch (err: any) {
    Log.error("[MMM-OneDrive] [convertHEIC] Error", { filename });
    Log.error(err?.stack || err);
    throw err;
  } finally {
    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-8 rss=${bytes(memory.rss)}`);

    if (heifImages && Array.isArray(heifImages)) {
      for (const heifImage of heifImages) {
        if (heifImage) {
          heifImage.free();
        }
      }
    }
    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-9 rss=${bytes(memory.rss)}`);
    if (heifDecoder) {
      heifDecoder.decoder.delete();
    }
    memory = process.memoryUsage();
    Log.debug(`[MMM-OneDrive] [rss] 4-10 rss=${bytes(memory.rss)}`);
  }
};