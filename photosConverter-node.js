const fs = require("fs");
const path = require("path");
const Log = require("logger");
const jpegJs = require("jpeg-js");
const libheif = require("./node_modules/libheif-js/libheif-wasm/libheif.js");
const libheifWasmPath = path.resolve(__dirname, "./node_modules/libheif-js/libheif-wasm/libheif.wasm");
const wasmBinary = fs.readFileSync(libheifWasmPath);
const libheifFactory = libheif({ wasmBinary: wasmBinary });

/**
 * Convert HEIC image to JPEG format.
 * @param {object} param0 - The parameters for the conversion.
 * @param {string} param0.id - The ID of the photo.
 * @param {string} param0.filename - The filename of the photo.
 * @param {string} param0.url - The URL of the photo.
 * @returns {Promise<Buffer>} - The converted image buffer.
 */
const convertHEIC = async ({ id, filename, url }) => {
  let heifDecoder;
  let heifImages;
  try {
    Log.debug("[MMM-OneDrive] convertHEIC", { id, filename, url });
    const d = new Date().getTime();
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    await libheifFactory.ready;
    heifDecoder = new libheifFactory.HeifDecoder();
    heifImages = await heifDecoder.decode(inputBuffer);
    const heifImage = heifImages[0];
    const w = heifImage.get_width();
    const h = heifImage.get_height();

    const decodedData = await new Promise((resolve, reject) => {
      heifImage.display({ data: new Uint8ClampedArray(w * h * 4), w, h }, (displayData) => {
        if (!displayData) {
          return reject(new Error("HEIF processing error"));
        }
        resolve(displayData);
      });
    });

    const outputBuffer = jpegJs.encode({
      width: w,
      height: h,
      data: decodedData.data,
      format: "JPEG",
      quality: 0.8,
    });
    Log.debug("[MMM-OneDrive] convertHEIC done", { duration: (new Date().getTime() - d) });
    return outputBuffer.data;
  } catch (err) {
    Log.error("[MMM-OneDrive] Error in convertHEIC", { id, filename, url });
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

module.exports = {
  convertHEIC,
};