


/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
// import path from "path";
import Log from "logger";
import jpegJs from "jpeg-js";
import libheifModule from "libheif-js/libheif-wasm/libheif.js";
import { Jimp } from "./customJimp";
// const libheifWasmPath = path.resolve(__dirname, "./node_modules/libheif-js/libheif-wasm/libheif.wasm");
const libheifWasmPath = require.resolve("libheif-js/libheif-wasm/libheif.wasm");
const wasmBinary = fs.readFileSync(libheifWasmPath);
const libheifFactoryPromise: Promise<any> = (libheifModule as any)({ wasmBinary });

export interface ConvertHEICParams {
  filename: string;
  arrayBuffer: ArrayBuffer;
  size?: { width: number; height: number };
}

const encodeJpeg = (buffer: ArrayBuffer, w: number, h: number) => {
  const jpegBuffRet = jpegJs.encode({
    width: w,
    height: h,
    data: buffer,
  }, 0.8);
  return jpegBuffRet.data;
};

const resize = async (buffer: ArrayBuffer, oldSize: { w: number; h: number }, newSize?: { w: number; h: number }) => {
  if (newSize) {
    try {
      // Resize the image if size is provided
      const image = await Jimp.fromBuffer(buffer);
      if (oldSize.w > oldSize.h) {
        image.resize({ w: newSize.w });
      } else {
        image.resize({ h: newSize.h });
      }
      const outputBuffer = await image.getBuffer("image/jpeg", { quality: 80 });
      return outputBuffer;
    } catch {
      return encodeJpeg(buffer, oldSize.w, oldSize.h);
    }
  } else {
    return encodeJpeg(buffer, oldSize.w, oldSize.h);
  }
};

export const convertHEIC = async ({ filename, arrayBuffer, size }: ConvertHEICParams) => {
  let heifDecoder: any;
  let heifImages: any[] | undefined;
  try {
    Log.debug("[MMM-OneDrive] [convertHEIC]", { filename });
    const d = Date.now();
    const inputBuffer = Buffer.from(arrayBuffer);

    const libheifFactory = await libheifFactoryPromise;
    await libheifFactory.ready;
    heifDecoder = new libheifFactory.HeifDecoder();
    heifImages = await heifDecoder.decode(inputBuffer);

    if (!heifImages || heifImages.length === 0) {
      throw new Error(`No HEIF images found in ${filename}.`);
    }

    const heifImage = heifImages[0];
    const w = heifImage.get_width();
    const h = heifImage.get_height();

    const decodedData: any = await new Promise((resolve, reject) => {
      heifImage.display({ data: new Uint8ClampedArray(w * h * 4), w, h }, (displayData: any) => {
        if (!displayData) {
          return reject(new Error("HEIF processing error"));
        }
        resolve(displayData);
      });
    });

    const outputBuffer = await resize(decodedData.data, { w, h }, size ? {
      w: size.width,
      h: size.height,
    } : undefined);
    Log.debug("[MMM-OneDrive] [convertHEIC] Done", { duration: Date.now() - d });
    return outputBuffer;
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