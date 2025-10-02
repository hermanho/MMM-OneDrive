/* eslint-disable @typescript-eslint/no-explicit-any */
import Log from "logger";
import sharp from "sharp";
import { getLibheifFactory } from "./externals/libheifJS";

export interface ConvertHEICParams {
  filename: string;
  data: ArrayBuffer;
}

type HeifImageDisplay = {
  data: Uint8ClampedArray;
};


export const convertHEIC = async ({ filename, data }: ConvertHEICParams) => {
  let heifDecoder: any;
  let heifImages: any[] | undefined;
  try {
    Log.debug("[MMM-OneDrive] [convertHEIC]", { filename });
    const d = Date.now();
    const libheifFactory = await getLibheifFactory();
    heifDecoder = new libheifFactory.HeifDecoder();
    heifImages = heifDecoder.decode(data);

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


    const sharpBuffer = sharp(decodedData.data, {
      raw: {
        width: w,
        height: h,
        channels: 4,
      },
    });

    const jpegData = await sharpBuffer
      .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
      .keepMetadata()
      .toBuffer();

    Log.debug("[MMM-OneDrive] [convertHEIC] Done", { duration: Date.now() - d });
    const outputArraybuffer = new ArrayBuffer(jpegData.byteLength);
    new Uint8Array(outputArraybuffer).set(new Uint8Array(jpegData));
    return outputArraybuffer;
  } catch (err: any) {
    Log.error("[MMM-OneDrive] [convertHEIC] Error", { filename });
    Log.error(err?.stack || err);
    throw err;
  } finally {
    if (heifImages && Array.isArray(heifImages)) {
      for (const heifImage of heifImages) {
        if (heifImage) {
          heifImage.free();
        }
      }
    }
    if (heifDecoder) {
      heifDecoder.decoder.delete();
    }
  }
};