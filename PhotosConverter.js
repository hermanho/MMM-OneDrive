const convert = require('heic-convert');

/**
 * 
 * @param {String} url 
 */
const convertHEIC = async (url) => {
  const resp = await fetch(url);
  const inputBuffer = Buffer.from(await resp.arrayBuffer());
  const outputBuffer = await convert({
    buffer: inputBuffer, // the HEIC file buffer
    format: 'JPEG',      // output format
    quality: 0.8           // the jpeg compression quality, between 0 and 1
  });
  return Buffer.from(outputBuffer);
}

module.exports = { convertHEIC }