const convert = require("heic-convert");
const Log = require("logger");

const convertHEIC = async ({ id, filename, url }) => {
  try {
    Log.debug("[MMM-OneDrive] convertHEIC", { id, filename, url });
    const d = new Date().getTime();
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const inputBuffer = new Uint8Array(arrayBuffer);
    const outputBuffer = await convert({
      buffer: inputBuffer, // the HEIC file buffer
      format: "JPEG",      // output format
      quality: 0.8,           // the jpeg compression quality, between 0 and 1
    });
    Log.debug("[MMM-OneDrive] convertHEIC done", { duration: (new Date().getTime() - d) });
    return outputBuffer;
  } catch (err) {
    console.error("[MMM-OneDrive] Error in convertHEIC", { id, filename, url });
    console.error(err?.stack || err);
    throw err;
  }
};

module.exports = {
  convertHEIC,
};