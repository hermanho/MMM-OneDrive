const convert = require('heic-convert');

/**
 * 
 * @param {{id: string, filename: string, url: string}} param0
 */
const convertHEIC = async ({ id, filename, url }) => {
  try {
    const resp = await fetch(url);
    const inputBuffer = Buffer.from(await resp.arrayBuffer());
    const outputBuffer = await convert({
      buffer: inputBuffer, // the HEIC file buffer
      format: 'JPEG',      // output format
      quality: 0.8,           // the jpeg compression quality, between 0 and 1
    });
    return Buffer.from(outputBuffer);
  } catch (err) {
    console.error('Error in convertHEIC', { id, filename, url });
    console.error(err?.stack || err);
    throw err;
  }
};

module.exports = { convertHEIC };