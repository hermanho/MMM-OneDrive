/*! *****************************************************************************
  mmm-onedrive
  Version 1.9.0

  MagicMirror² module to display your photos from OneDrive.
  Please submit bugs at https://github.com/hermanho/MMM-OneDrive/issues

  (c) hermanho
  Licence: MIT

  This file is auto-generated. Do not edit.
***************************************************************************** */

"use strict";

var require$$1 = require("tty"), require$$1$1 = require("util"), require$$0 = require("os"), Log = require("logger"), fs$1 = require("node:fs/promises"), sharp = require("sharp"), fs = require("node:fs"), libheifWASMModule = require("libheif-js/libheif-wasm/libheif.js"), node_events = require("node:events");

function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x.default : x;
}

var hasRequiredIeee754, ieee754 = {};

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */ hasRequiredIeee754 || (hasRequiredIeee754 = 1, 
ieee754.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m, eLen = 8 * nBytes - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7, i = isLE ? nBytes - 1 : 0, d = isLE ? -1 : 1, s = buffer[offset + i];
  for (i += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen; nBits > 0; e = 256 * e + buffer[offset + i], 
  i += d, nBits -= 8) {}
  for (m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen; nBits > 0; m = 256 * m + buffer[offset + i], 
  i += d, nBits -= 8) {}
  if (0 === e) {
    e = 1 - eBias;
  } else {
    if (e === eMax) {
      return m ? NaN : 1 / 0 * (s ? -1 : 1);
    }
    m += Math.pow(2, mLen), e -= eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}, ieee754.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c, eLen = 8 * nBytes - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, rt = 23 === mLen ? Math.pow(2, -24) - Math.pow(2, -77) : 0, i = isLE ? 0 : nBytes - 1, d = isLE ? 1 : -1, s = value < 0 || 0 === value && 1 / value < 0 ? 1 : 0;
  for (value = Math.abs(value), isNaN(value) || value === 1 / 0 ? (m = isNaN(value) ? 1 : 0, 
  e = eMax) : (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1 && (e--, 
  c *= 2), (value += e + eBias >= 1 ? rt / c : rt * Math.pow(2, 1 - eBias)) * c >= 2 && (e++, 
  c /= 2), e + eBias >= eMax ? (m = 0, e = eMax) : e + eBias >= 1 ? (m = (value * c - 1) * Math.pow(2, mLen), 
  e += eBias) : (m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0)); mLen >= 8; buffer[offset + i] = 255 & m, 
  i += d, m /= 256, mLen -= 8) {}
  for (e = e << mLen | m, eLen += mLen; eLen > 0; buffer[offset + i] = 255 & e, i += d, 
  e /= 256, eLen -= 8) {}
  buffer[offset + i - d] |= 128 * s;
});

const WINDOWS_1252_EXTRA = {
  128: "€",
  130: "‚",
  131: "ƒ",
  132: "„",
  133: "…",
  134: "†",
  135: "‡",
  136: "ˆ",
  137: "‰",
  138: "Š",
  139: "‹",
  140: "Œ",
  142: "Ž",
  145: "‘",
  146: "’",
  147: "“",
  148: "”",
  149: "•",
  150: "–",
  151: "—",
  152: "˜",
  153: "™",
  154: "š",
  155: "›",
  156: "œ",
  158: "ž",
  159: "Ÿ"
};

for (const [code, char] of Object.entries(WINDOWS_1252_EXTRA)) {}

let _utf8Decoder;

function textDecode(bytes, encoding = "utf-8") {
  switch (encoding.toLowerCase()) {
   case "utf-8":
   case "utf8":
    {
      const dec = function() {
        if (void 0 !== globalThis.TextDecoder) {
          return null != _utf8Decoder ? _utf8Decoder : _utf8Decoder = new globalThis.TextDecoder("utf-8");
        }
      }();
      return dec ? dec.decode(bytes) : function(bytes) {
        const parts = [], chunk = [];
        let i = 0;
        bytes.length >= 3 && 239 === bytes[0] && 187 === bytes[1] && 191 === bytes[2] && (i = 3);
        for (;i < bytes.length; ) {
          const b1 = bytes[i];
          if (b1 <= 127) {
            pushCodeUnit(parts, chunk, b1), i++;
            continue;
          }
          if (b1 < 194 || b1 > 244) {
            pushCodeUnit(parts, chunk, 65533), i++;
            continue;
          }
          if (b1 <= 223) {
            if (i + 1 >= bytes.length) {
              pushCodeUnit(parts, chunk, 65533), i++;
              continue;
            }
            const b2 = bytes[i + 1];
            if (128 != (192 & b2)) {
              pushCodeUnit(parts, chunk, 65533), i++;
              continue;
            }
            pushCodeUnit(parts, chunk, (31 & b1) << 6 | 63 & b2), i += 2;
            continue;
          }
          if (b1 <= 239) {
            if (i + 2 >= bytes.length) {
              pushCodeUnit(parts, chunk, 65533), i++;
              continue;
            }
            const b2 = bytes[i + 1], b3 = bytes[i + 2];
            if (!!(128 != (192 & b2) || 128 != (192 & b3) || 224 === b1 && b2 < 160 || 237 === b1 && b2 >= 160)) {
              pushCodeUnit(parts, chunk, 65533), i++;
              continue;
            }
            pushCodeUnit(parts, chunk, (15 & b1) << 12 | (63 & b2) << 6 | 63 & b3), i += 3;
            continue;
          }
          if (i + 3 >= bytes.length) {
            pushCodeUnit(parts, chunk, 65533), i++;
            continue;
          }
          const b2 = bytes[i + 1], b3 = bytes[i + 2], b4 = bytes[i + 3];
          if (!!(128 != (192 & b2) || 128 != (192 & b3) || 128 != (192 & b4) || 240 === b1 && b2 < 144 || 244 === b1 && b2 > 143)) {
            pushCodeUnit(parts, chunk, 65533), i++;
            continue;
          }
          pushCodePoint(parts, chunk, (7 & b1) << 18 | (63 & b2) << 12 | (63 & b3) << 6 | 63 & b4), 
          i += 4;
        }
        return flushChunk(parts, chunk), parts.join("");
      }(bytes);
    }

   case "utf-16le":
    return function(bytes) {
      const parts = [], chunk = [], len = bytes.length;
      let i = 0;
      for (;i + 1 < len; ) {
        const u1 = bytes[i] | bytes[i + 1] << 8;
        if (i += 2, u1 >= 55296 && u1 <= 56319) {
          if (i + 1 < len) {
            const u2 = bytes[i] | bytes[i + 1] << 8;
            u2 >= 56320 && u2 <= 57343 ? (pushCodeUnit(parts, chunk, u1), pushCodeUnit(parts, chunk, u2), 
            i += 2) : pushCodeUnit(parts, chunk, 65533);
          } else {
            pushCodeUnit(parts, chunk, 65533);
          }
        } else {
          pushCodeUnit(parts, chunk, u1 >= 56320 && u1 <= 57343 ? 65533 : u1);
        }
      }
      i < len && pushCodeUnit(parts, chunk, 65533);
      return flushChunk(parts, chunk), parts.join("");
    }(bytes);

   case "us-ascii":
   case "ascii":
    return function(bytes) {
      const parts = [];
      for (let i = 0; i < bytes.length; i += 32768) {
        const end = Math.min(bytes.length, i + 32768), codes = new Array(end - i);
        for (let j = i, k = 0; j < end; j++, k++) {
          codes[k] = 127 & bytes[j];
        }
        parts.push(String.fromCharCode.apply(null, codes));
      }
      return parts.join("");
    }(bytes);

   case "latin1":
   case "iso-8859-1":
    return function(bytes) {
      const parts = [];
      for (let i = 0; i < bytes.length; i += 32768) {
        const end = Math.min(bytes.length, i + 32768), codes = new Array(end - i);
        for (let j = i, k = 0; j < end; j++, k++) {
          codes[k] = bytes[j];
        }
        parts.push(String.fromCharCode.apply(null, codes));
      }
      return parts.join("");
    }(bytes);

   case "windows-1252":
    return function(bytes) {
      const parts = [];
      let out = "";
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i], extra = b >= 128 && b <= 159 ? WINDOWS_1252_EXTRA[b] : void 0;
        out += null != extra ? extra : String.fromCharCode(b), out.length >= 32768 && (parts.push(out), 
        out = "");
      }
      out && parts.push(out);
      return parts.join("");
    }(bytes);

   default:
    throw new RangeError(`Encoding '${encoding}' not supported`);
  }
}

function flushChunk(parts, chunk) {
  0 !== chunk.length && (parts.push(String.fromCharCode.apply(null, chunk)), chunk.length = 0);
}

function pushCodeUnit(parts, chunk, codeUnit) {
  chunk.push(codeUnit), chunk.length >= 32768 && flushChunk(parts, chunk);
}

function pushCodePoint(parts, chunk, cp) {
  cp <= 65535 ? pushCodeUnit(parts, chunk, cp) : (pushCodeUnit(parts, chunk, 55296 + ((cp -= 65536) >> 10)), 
  pushCodeUnit(parts, chunk, 56320 + (1023 & cp)));
}

function dv(array) {
  return new DataView(array.buffer, array.byteOffset);
}

const UINT8 = {
  len: 1,
  get: (array, offset) => dv(array).getUint8(offset),
  put: (array, offset, value) => (dv(array).setUint8(offset, value), offset + 1)
}, UINT16_LE = {
  len: 2,
  get: (array, offset) => dv(array).getUint16(offset, !0),
  put: (array, offset, value) => (dv(array).setUint16(offset, value, !0), offset + 2)
}, UINT16_BE = {
  len: 2,
  get: (array, offset) => dv(array).getUint16(offset),
  put: (array, offset, value) => (dv(array).setUint16(offset, value), offset + 2)
}, UINT32_LE = {
  len: 4,
  get: (array, offset) => dv(array).getUint32(offset, !0),
  put: (array, offset, value) => (dv(array).setUint32(offset, value, !0), offset + 4)
}, UINT32_BE = {
  len: 4,
  get: (array, offset) => dv(array).getUint32(offset),
  put: (array, offset, value) => (dv(array).setUint32(offset, value), offset + 4)
}, INT32_BE = {
  len: 4,
  get: (array, offset) => dv(array).getInt32(offset),
  put: (array, offset, value) => (dv(array).setInt32(offset, value), offset + 4)
}, UINT64_LE = {
  len: 8,
  get: (array, offset) => dv(array).getBigUint64(offset, !0),
  put: (array, offset, value) => (dv(array).setBigUint64(offset, value, !0), offset + 8)
};

class StringType {
  constructor(len, encoding) {
    this.len = len, this.encoding = encoding;
  }
  get(data, offset = 0) {
    return textDecode(data.subarray(offset, offset + this.len), this.encoding);
  }
}

class EndOfStreamError extends Error {
  constructor() {
    super("End-Of-Stream"), this.name = "EndOfStreamError";
  }
}

class AbortError extends Error {
  constructor(message = "The operation was aborted") {
    super(message), this.name = "AbortError";
  }
}

class AbstractStreamReader {
  constructor() {
    this.endOfStream = !1, this.interrupted = !1, this.peekQueue = [];
  }
  async peek(uint8Array, mayBeLess = !1) {
    const bytesRead = await this.read(uint8Array, mayBeLess);
    return this.peekQueue.push(uint8Array.subarray(0, bytesRead)), bytesRead;
  }
  async read(buffer, mayBeLess = !1) {
    if (0 === buffer.length) {
      return 0;
    }
    let bytesRead = this.readFromPeekBuffer(buffer);
    if (this.endOfStream || (bytesRead += await this.readRemainderFromStream(buffer.subarray(bytesRead), mayBeLess)), 
    0 === bytesRead && !mayBeLess) {
      throw new EndOfStreamError;
    }
    return bytesRead;
  }
  readFromPeekBuffer(buffer) {
    let remaining = buffer.length, bytesRead = 0;
    for (;this.peekQueue.length > 0 && remaining > 0; ) {
      const peekData = this.peekQueue.pop();
      if (!peekData) {
        throw new Error("peekData should be defined");
      }
      const lenCopy = Math.min(peekData.length, remaining);
      buffer.set(peekData.subarray(0, lenCopy), bytesRead), bytesRead += lenCopy, remaining -= lenCopy, 
      lenCopy < peekData.length && this.peekQueue.push(peekData.subarray(lenCopy));
    }
    return bytesRead;
  }
  async readRemainderFromStream(buffer, mayBeLess) {
    let bytesRead = 0;
    for (;bytesRead < buffer.length && !this.endOfStream; ) {
      if (this.interrupted) {
        throw new AbortError;
      }
      const chunkLen = await this.readFromStream(buffer.subarray(bytesRead), mayBeLess);
      if (0 === chunkLen) {
        break;
      }
      bytesRead += chunkLen;
    }
    if (!mayBeLess && bytesRead < buffer.length) {
      throw new EndOfStreamError;
    }
    return bytesRead;
  }
}

class WebStreamReader extends AbstractStreamReader {
  constructor(reader) {
    super(), this.reader = reader;
  }
  async abort() {
    return this.close();
  }
  async close() {
    this.reader.releaseLock();
  }
}

class WebStreamByobReader extends WebStreamReader {
  async readFromStream(buffer, mayBeLess) {
    if (0 === buffer.length) {
      return 0;
    }
    const result = await this.reader.read(new Uint8Array(buffer.length), {
      min: mayBeLess ? void 0 : buffer.length
    });
    return result.done && (this.endOfStream = result.done), result.value ? (buffer.set(result.value), 
    result.value.length) : 0;
  }
}

class WebStreamDefaultReader extends AbstractStreamReader {
  constructor(reader) {
    super(), this.reader = reader, this.buffer = null;
  }
  writeChunk(target, chunk) {
    const written = Math.min(chunk.length, target.length);
    return target.set(chunk.subarray(0, written)), written < chunk.length ? this.buffer = chunk.subarray(written) : this.buffer = null, 
    written;
  }
  async readFromStream(buffer, mayBeLess) {
    if (0 === buffer.length) {
      return 0;
    }
    let totalBytesRead = 0;
    for (this.buffer && (totalBytesRead += this.writeChunk(buffer, this.buffer)); totalBytesRead < buffer.length && !this.endOfStream; ) {
      const result = await this.reader.read();
      if (result.done) {
        this.endOfStream = !0;
        break;
      }
      result.value && (totalBytesRead += this.writeChunk(buffer.subarray(totalBytesRead), result.value));
    }
    if (!mayBeLess && 0 === totalBytesRead && this.endOfStream) {
      throw new EndOfStreamError;
    }
    return totalBytesRead;
  }
  abort() {
    return this.interrupted = !0, this.reader.cancel();
  }
  async close() {
    await this.abort(), this.reader.releaseLock();
  }
}

class AbstractTokenizer {
  constructor(options) {
    this.numBuffer = new Uint8Array(8), this.position = 0, this.onClose = options?.onClose, 
    options?.abortSignal && options.abortSignal.addEventListener("abort", () => {
      this.abort();
    });
  }
  async readToken(token, position = this.position) {
    const uint8Array = new Uint8Array(token.len);
    if (await this.readBuffer(uint8Array, {
      position: position
    }) < token.len) {
      throw new EndOfStreamError;
    }
    return token.get(uint8Array, 0);
  }
  async peekToken(token, position = this.position) {
    const uint8Array = new Uint8Array(token.len);
    if (await this.peekBuffer(uint8Array, {
      position: position
    }) < token.len) {
      throw new EndOfStreamError;
    }
    return token.get(uint8Array, 0);
  }
  async readNumber(token) {
    if (await this.readBuffer(this.numBuffer, {
      length: token.len
    }) < token.len) {
      throw new EndOfStreamError;
    }
    return token.get(this.numBuffer, 0);
  }
  async peekNumber(token) {
    if (await this.peekBuffer(this.numBuffer, {
      length: token.len
    }) < token.len) {
      throw new EndOfStreamError;
    }
    return token.get(this.numBuffer, 0);
  }
  async ignore(length) {
    if (length < 0) {
      throw new RangeError("ignore length must be ≥ 0 bytes");
    }
    if (void 0 !== this.fileInfo.size) {
      const bytesLeft = this.fileInfo.size - this.position;
      if (length > bytesLeft) {
        return this.position += bytesLeft, bytesLeft;
      }
    }
    return this.position += length, length;
  }
  async close() {
    await this.abort(), await (this.onClose?.());
  }
  normalizeOptions(uint8Array, options) {
    if (!this.supportsRandomAccess() && options && void 0 !== options.position && options.position < this.position) {
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    }
    return {
      mayBeLess: !1,
      offset: 0,
      length: uint8Array.length,
      position: this.position,
      ...options
    };
  }
  abort() {
    return Promise.resolve();
  }
}

class ReadStreamTokenizer extends AbstractTokenizer {
  constructor(streamReader, options) {
    super(options), this.streamReader = streamReader, this.fileInfo = options?.fileInfo ?? {};
  }
  async readBuffer(uint8Array, options) {
    const normOptions = this.normalizeOptions(uint8Array, options), skipBytes = normOptions.position - this.position;
    if (skipBytes > 0) {
      return await this.ignore(skipBytes), this.readBuffer(uint8Array, options);
    }
    if (skipBytes < 0) {
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    }
    if (0 === normOptions.length) {
      return 0;
    }
    const bytesRead = await this.streamReader.read(uint8Array.subarray(0, normOptions.length), normOptions.mayBeLess);
    if (this.position += bytesRead, (!options || !options.mayBeLess) && bytesRead < normOptions.length) {
      throw new EndOfStreamError;
    }
    return bytesRead;
  }
  async peekBuffer(uint8Array, options) {
    const normOptions = this.normalizeOptions(uint8Array, options);
    let bytesRead = 0;
    if (normOptions.position) {
      const skipBytes = normOptions.position - this.position;
      if (skipBytes > 0) {
        const skipBuffer = new Uint8Array(normOptions.length + skipBytes);
        return bytesRead = await this.peekBuffer(skipBuffer, {
          mayBeLess: normOptions.mayBeLess
        }), uint8Array.set(skipBuffer.subarray(skipBytes)), bytesRead - skipBytes;
      }
      if (skipBytes < 0) {
        throw new Error("Cannot peek from a negative offset in a stream");
      }
    }
    if (normOptions.length > 0) {
      try {
        bytesRead = await this.streamReader.peek(uint8Array.subarray(0, normOptions.length), normOptions.mayBeLess);
      } catch (err) {
        if (options?.mayBeLess && err instanceof EndOfStreamError) {
          return 0;
        }
        throw err;
      }
      if (!normOptions.mayBeLess && bytesRead < normOptions.length) {
        throw new EndOfStreamError;
      }
    }
    return bytesRead;
  }
  async ignore(length) {
    if (length < 0) {
      throw new RangeError("ignore length must be ≥ 0 bytes");
    }
    const bufSize = Math.min(256e3, length), buf = new Uint8Array(bufSize);
    let totBytesRead = 0;
    for (;totBytesRead < length; ) {
      const remaining = length - totBytesRead, bytesRead = await this.readBuffer(buf, {
        length: Math.min(bufSize, remaining)
      });
      if (bytesRead < 0) {
        return bytesRead;
      }
      totBytesRead += bytesRead;
    }
    return totBytesRead;
  }
  abort() {
    return this.streamReader.abort();
  }
  async close() {
    return this.streamReader.close();
  }
  supportsRandomAccess() {
    return !1;
  }
}

class BufferTokenizer extends AbstractTokenizer {
  constructor(uint8Array, options) {
    super(options), this.uint8Array = uint8Array, this.fileInfo = {
      ...options?.fileInfo ?? {},
      size: uint8Array.length
    };
  }
  async readBuffer(uint8Array, options) {
    options?.position && (this.position = options.position);
    const bytesRead = await this.peekBuffer(uint8Array, options);
    return this.position += bytesRead, bytesRead;
  }
  async peekBuffer(uint8Array, options) {
    const normOptions = this.normalizeOptions(uint8Array, options), bytes2read = Math.min(this.uint8Array.length - normOptions.position, normOptions.length);
    if (!normOptions.mayBeLess && bytes2read < normOptions.length) {
      throw new EndOfStreamError;
    }
    return uint8Array.set(this.uint8Array.subarray(normOptions.position, normOptions.position + bytes2read)), 
    bytes2read;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(position) {
    this.position = position;
  }
}

class BlobTokenizer extends AbstractTokenizer {
  constructor(blob, options) {
    super(options), this.blob = blob, this.fileInfo = {
      ...options?.fileInfo ?? {},
      size: blob.size,
      mimeType: blob.type
    };
  }
  async readBuffer(uint8Array, options) {
    options?.position && (this.position = options.position);
    const bytesRead = await this.peekBuffer(uint8Array, options);
    return this.position += bytesRead, bytesRead;
  }
  async peekBuffer(buffer, options) {
    const normOptions = this.normalizeOptions(buffer, options), bytes2read = Math.min(this.blob.size - normOptions.position, normOptions.length);
    if (!normOptions.mayBeLess && bytes2read < normOptions.length) {
      throw new EndOfStreamError;
    }
    const arrayBuffer = await this.blob.slice(normOptions.position, normOptions.position + bytes2read).arrayBuffer();
    return buffer.set(new Uint8Array(arrayBuffer)), bytes2read;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(position) {
    this.position = position;
  }
}

function fromWebStream(webStream, options) {
  const webStreamReader = function(stream) {
    try {
      const reader = stream.getReader({
        mode: "byob"
      });
      return reader instanceof ReadableStreamDefaultReader ? new WebStreamDefaultReader(reader) : new WebStreamByobReader(reader);
    } catch (error) {
      if (error instanceof TypeError) {
        return new WebStreamDefaultReader(stream.getReader());
      }
      throw error;
    }
  }(webStream), _options = options ?? {}, chainedClose = _options.onClose;
  return _options.onClose = async () => {
    if (await webStreamReader.close(), chainedClose) {
      return chainedClose();
    }
  }, new ReadStreamTokenizer(webStreamReader, _options);
}

var ms, hasRequiredMs, common, hasRequiredCommon, hasRequiredBrowser, src = {
  exports: {}
}, browser = {
  exports: {}
};

function requireMs() {
  if (hasRequiredMs) {
    return ms;
  }
  hasRequiredMs = 1;
  var s = 1e3, m = 60 * s, h = 60 * m, d = 24 * h, w = 7 * d, y = 365.25 * d;
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= 1.5 * n;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if ("string" === type && val.length > 0) {
      return function(str) {
        if ((str = String(str)).length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        switch ((match[2] || "ms").toLowerCase()) {
         case "years":
         case "year":
         case "yrs":
         case "yr":
         case "y":
          return n * y;

         case "weeks":
         case "week":
         case "w":
          return n * w;

         case "days":
         case "day":
         case "d":
          return n * d;

         case "hours":
         case "hour":
         case "hrs":
         case "hr":
         case "h":
          return n * h;

         case "minutes":
         case "minute":
         case "mins":
         case "min":
         case "m":
          return n * m;

         case "seconds":
         case "second":
         case "secs":
         case "sec":
         case "s":
          return n * s;

         case "milliseconds":
         case "millisecond":
         case "msecs":
         case "msec":
         case "ms":
          return n;

         default:
          return;
        }
      }(val);
    }
    if ("number" === type && isFinite(val)) {
      return options.long ? function(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }(val) : function(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
}

function requireCommon() {
  if (hasRequiredCommon) {
    return common;
  }
  return hasRequiredCommon = 1, common = function(env) {
    function createDebug(namespace) {
      let prevTime, namespacesCache, enabledCache, enableOverride = null;
      function debug(...args) {
        if (!debug.enabled) {
          return;
        }
        const self = debug, curr = Number(new Date), ms = curr - (prevTime || curr);
        self.diff = ms, self.prev = prevTime, self.curr = curr, prevTime = curr, args[0] = createDebug.coerce(args[0]), 
        "string" != typeof args[0] && args.unshift("%O");
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if ("%%" === match) {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if ("function" == typeof formatter) {
            const val = args[index];
            match = formatter.call(self, val), args.splice(index, 1), index--;
          }
          return match;
        }), createDebug.formatArgs.call(self, args);
        (self.log || createDebug.log).apply(self, args);
      }
      return debug.namespace = namespace, debug.useColors = createDebug.useColors(), debug.color = createDebug.selectColor(namespace), 
      debug.extend = extend, debug.destroy = createDebug.destroy, Object.defineProperty(debug, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => null !== enableOverride ? enableOverride : (namespacesCache !== createDebug.namespaces && (namespacesCache = createDebug.namespaces, 
        enabledCache = createDebug.enabled(namespace)), enabledCache),
        set: v => {
          enableOverride = v;
        }
      }), "function" == typeof createDebug.init && createDebug.init(debug), debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (void 0 === delimiter ? ":" : delimiter) + namespace);
      return newDebug.log = this.log, newDebug;
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0, templateIndex = 0, starIndex = -1, matchIndex = 0;
      for (;searchIndex < search.length; ) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || "*" === template[templateIndex])) {
          "*" === template[templateIndex] ? (starIndex = templateIndex, matchIndex = searchIndex, 
          templateIndex++) : (searchIndex++, templateIndex++);
        } else {
          if (-1 === starIndex) {
            return !1;
          }
          templateIndex = starIndex + 1, matchIndex++, searchIndex = matchIndex;
        }
      }
      for (;templateIndex < template.length && "*" === template[templateIndex]; ) {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    return createDebug.debug = createDebug, createDebug.default = createDebug, createDebug.coerce = function(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }, createDebug.disable = function() {
      const namespaces = [ ...createDebug.names, ...createDebug.skips.map(namespace => "-" + namespace) ].join(",");
      return createDebug.enable(""), namespaces;
    }, createDebug.enable = function(namespaces) {
      createDebug.save(namespaces), createDebug.namespaces = namespaces, createDebug.names = [], 
      createDebug.skips = [];
      const split = ("string" == typeof namespaces ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        "-" === ns[0] ? createDebug.skips.push(ns.slice(1)) : createDebug.names.push(ns);
      }
    }, createDebug.enabled = function(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return !1;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return !0;
        }
      }
      return !1;
    }, createDebug.humanize = requireMs(), createDebug.destroy = function() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }, Object.keys(env).forEach(key => {
      createDebug[key] = env[key];
    }), createDebug.names = [], createDebug.skips = [], createDebug.formatters = {}, 
    createDebug.selectColor = function(namespace) {
      let hash = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i), hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }, createDebug.enable(createDebug.load()), createDebug;
  }, common;
}

var hasFlag, hasRequiredHasFlag, supportsColor_1, hasRequiredSupportsColor, hasRequiredNode, hasRequiredSrc, node = {
  exports: {}
};

function requireHasFlag() {
  return hasRequiredHasFlag ? hasFlag : (hasRequiredHasFlag = 1, hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : 1 === flag.length ? "-" : "--", position = argv.indexOf(prefix + flag), terminatorPosition = argv.indexOf("--");
    return -1 !== position && (-1 === terminatorPosition || position < terminatorPosition);
  });
}

function requireNode() {
  return hasRequiredNode || (hasRequiredNode = 1, function(module, exports) {
    const tty = require$$1, util = require$$1$1;
    exports.init = function(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }, exports.log = function(...args) {
      return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }, exports.formatArgs = function(args) {
      const {namespace: name, useColors: useColors} = this;
      if (useColors) {
        const c = this.color, colorCode = "[3" + (c < 8 ? c : "8;5;" + c), prefix = `  ${colorCode};1m${name} [0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix), args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "[0m");
      } else {
        args[0] = function() {
          if (exports.inspectOpts.hideDate) {
            return "";
          }
          return (new Date).toISOString() + " ";
        }() + name + " " + args[0];
      }
    }, exports.save = function(namespaces) {
      namespaces ? process.env.DEBUG = namespaces : delete process.env.DEBUG;
    }, exports.load = function() {
      return process.env.DEBUG;
    }, exports.useColors = function() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }, exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."), 
    exports.colors = [ 6, 2, 3, 4, 5, 1 ];
    try {
      const supportsColor = function() {
        if (hasRequiredSupportsColor) {
          return supportsColor_1;
        }
        hasRequiredSupportsColor = 1;
        const os = require$$0, tty = require$$1, hasFlag = requireHasFlag(), {env: env} = process;
        let forceColor;
        function translateLevel(level) {
          return 0 !== level && {
            level: level,
            hasBasic: !0,
            has256: level >= 2,
            has16m: level >= 3
          };
        }
        function supportsColor(haveStream, streamIsTTY) {
          if (0 === forceColor) {
            return 0;
          }
          if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
            return 3;
          }
          if (hasFlag("color=256")) {
            return 2;
          }
          if (haveStream && !streamIsTTY && void 0 === forceColor) {
            return 0;
          }
          const min = forceColor || 0;
          if ("dumb" === env.TERM) {
            return min;
          }
          if ("win32" === process.platform) {
            const osRelease = os.release().split(".");
            return Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586 ? Number(osRelease[2]) >= 14931 ? 3 : 2 : 1;
          }
          if ("CI" in env) {
            return [ "TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE" ].some(sign => sign in env) || "codeship" === env.CI_NAME ? 1 : min;
          }
          if ("TEAMCITY_VERSION" in env) {
            return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
          }
          if ("truecolor" === env.COLORTERM) {
            return 3;
          }
          if ("TERM_PROGRAM" in env) {
            const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
            switch (env.TERM_PROGRAM) {
             case "iTerm.app":
              return version >= 3 ? 3 : 2;

             case "Apple_Terminal":
              return 2;
            }
          }
          return /-256(color)?$/i.test(env.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM) || "COLORTERM" in env ? 1 : min;
        }
        return hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never") ? forceColor = 0 : (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) && (forceColor = 1), 
        "FORCE_COLOR" in env && (forceColor = "true" === env.FORCE_COLOR ? 1 : "false" === env.FORCE_COLOR ? 0 : 0 === env.FORCE_COLOR.length ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3)), 
        supportsColor_1 = {
          supportsColor: function(stream) {
            return translateLevel(supportsColor(stream, stream && stream.isTTY));
          },
          stdout: translateLevel(supportsColor(!0, tty.isatty(1))),
          stderr: translateLevel(supportsColor(!0, tty.isatty(2)))
        };
      }();
      supportsColor && (supportsColor.stderr || supportsColor).level >= 2 && (exports.colors = [ 20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221 ]);
    } catch (error) {}
    exports.inspectOpts = Object.keys(process.env).filter(key => /^debug_/i.test(key)).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => k.toUpperCase());
      let val = process.env[key];
      return val = !!/^(yes|on|true|enabled)$/i.test(val) || !/^(no|off|false|disabled)$/i.test(val) && ("null" === val ? null : Number(val)), 
      obj[prop] = val, obj;
    }, {}), module.exports = requireCommon()(exports);
    const {formatters: formatters} = module.exports;
    formatters.o = function(v) {
      return this.inspectOpts.colors = this.useColors, util.inspect(v, this.inspectOpts).split("\n").map(str => str.trim()).join(" ");
    }, formatters.O = function(v) {
      return this.inspectOpts.colors = this.useColors, util.inspect(v, this.inspectOpts);
    };
  }(node, node.exports)), node.exports;
}

var initDebug = getDefaultExportFromCjs((hasRequiredSrc || (hasRequiredSrc = 1, 
"undefined" == typeof process || "renderer" === process.type || !0 === process.browser || process.__nwjs ? src.exports = (hasRequiredBrowser || (hasRequiredBrowser = 1, 
function(module, exports) {
  exports.formatArgs = function(args) {
    if (args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff), 
    !this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0, lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, match => {
      "%%" !== match && (index++, "%c" === match && (lastC = index));
    }), args.splice(lastC, 0, c);
  }, exports.save = function(namespaces) {
    try {
      namespaces ? exports.storage.setItem("debug", namespaces) : exports.storage.removeItem("debug");
    } catch (error) {}
  }, exports.load = function() {
    let r;
    try {
      r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
    } catch (error) {}
    return !r && "undefined" != typeof process && "env" in process && (r = process.env.DEBUG), 
    r;
  }, exports.useColors = function() {
    if ("undefined" != typeof window && window.process && ("renderer" === window.process.type || window.process.__nwjs)) {
      return !0;
    }
    if ("undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return !1;
    }
    let m;
    return "undefined" != typeof document && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || "undefined" != typeof window && window.console && (window.console.firebug || window.console.exception && window.console.table) || "undefined" != typeof navigator && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }, exports.storage = function() {
    try {
      return localStorage;
    } catch (error) {}
  }(), exports.destroy = (() => {
    let warned = !1;
    return () => {
      warned || (warned = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
    };
  })(), exports.colors = [ "#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33" ], 
  exports.log = console.debug || console.log || (() => {}), module.exports = requireCommon()(exports);
  const {formatters: formatters} = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
}(browser, browser.exports)), browser.exports) : src.exports = requireNode()), src.exports));

const Signature_LocalFileHeader = 67324752, Signature_DataDescriptor = 134695760, Signature_CentralFileHeader = 33639248, Signature_EndOfCentralDirectory = 101010256, DataDescriptor = {
  get: array => ({
    signature: UINT32_LE.get(array, 0),
    compressedSize: UINT32_LE.get(array, 8),
    uncompressedSize: UINT32_LE.get(array, 12)
  }),
  len: 16
}, LocalFileHeaderToken = {
  get(array) {
    const flags = UINT16_LE.get(array, 6);
    return {
      signature: UINT32_LE.get(array, 0),
      minVersion: UINT16_LE.get(array, 4),
      dataDescriptor: !!(8 & flags),
      compressedMethod: UINT16_LE.get(array, 8),
      compressedSize: UINT32_LE.get(array, 18),
      uncompressedSize: UINT32_LE.get(array, 22),
      filenameLength: UINT16_LE.get(array, 26),
      extraFieldLength: UINT16_LE.get(array, 28),
      filename: null
    };
  },
  len: 30
}, EndOfCentralDirectoryRecordToken = {
  get: array => ({
    signature: UINT32_LE.get(array, 0),
    nrOfThisDisk: UINT16_LE.get(array, 4),
    nrOfThisDiskWithTheStart: UINT16_LE.get(array, 6),
    nrOfEntriesOnThisDisk: UINT16_LE.get(array, 8),
    nrOfEntriesOfSize: UINT16_LE.get(array, 10),
    sizeOfCd: UINT32_LE.get(array, 12),
    offsetOfStartOfCd: UINT32_LE.get(array, 16),
    zipFileCommentLength: UINT16_LE.get(array, 20)
  }),
  len: 22
}, FileHeader = {
  get(array) {
    const flags = UINT16_LE.get(array, 8);
    return {
      signature: UINT32_LE.get(array, 0),
      minVersion: UINT16_LE.get(array, 6),
      dataDescriptor: !!(8 & flags),
      compressedMethod: UINT16_LE.get(array, 10),
      compressedSize: UINT32_LE.get(array, 20),
      uncompressedSize: UINT32_LE.get(array, 24),
      filenameLength: UINT16_LE.get(array, 28),
      extraFieldLength: UINT16_LE.get(array, 30),
      fileCommentLength: UINT16_LE.get(array, 32),
      relativeOffsetOfLocalHeader: UINT32_LE.get(array, 42),
      filename: null
    };
  },
  len: 46
};

function signatureToArray(signature) {
  const signatureBytes = new Uint8Array(UINT32_LE.len);
  return UINT32_LE.put(signatureBytes, 0, signature), signatureBytes;
}

const debug = initDebug("tokenizer:inflate"), ddSignatureArray = signatureToArray(Signature_DataDescriptor), eocdSignatureBytes = signatureToArray(Signature_EndOfCentralDirectory);

class ZipHandler {
  constructor(tokenizer) {
    this.tokenizer = tokenizer, this.syncBuffer = new Uint8Array(262144);
  }
  async isZip() {
    return await this.peekSignature() === Signature_LocalFileHeader;
  }
  peekSignature() {
    return this.tokenizer.peekToken(UINT32_LE);
  }
  async findEndOfCentralDirectoryLocator() {
    const randomReadTokenizer = this.tokenizer, chunkLength = Math.min(16384, randomReadTokenizer.fileInfo.size), buffer = this.syncBuffer.subarray(0, chunkLength);
    await this.tokenizer.readBuffer(buffer, {
      position: randomReadTokenizer.fileInfo.size - chunkLength
    });
    for (let i = buffer.length - 4; i >= 0; i--) {
      if (buffer[i] === eocdSignatureBytes[0] && buffer[i + 1] === eocdSignatureBytes[1] && buffer[i + 2] === eocdSignatureBytes[2] && buffer[i + 3] === eocdSignatureBytes[3]) {
        return randomReadTokenizer.fileInfo.size - chunkLength + i;
      }
    }
    return -1;
  }
  async readCentralDirectory() {
    if (!this.tokenizer.supportsRandomAccess()) {
      return void debug("Cannot reading central-directory without random-read support");
    }
    debug("Reading central-directory...");
    const pos = this.tokenizer.position, offset = await this.findEndOfCentralDirectoryLocator();
    if (offset > 0) {
      debug("Central-directory 32-bit signature found");
      const eocdHeader = await this.tokenizer.readToken(EndOfCentralDirectoryRecordToken, offset), files = [];
      this.tokenizer.setPosition(eocdHeader.offsetOfStartOfCd);
      for (let n = 0; n < eocdHeader.nrOfEntriesOfSize; ++n) {
        const entry = await this.tokenizer.readToken(FileHeader);
        if (entry.signature !== Signature_CentralFileHeader) {
          throw new Error("Expected Central-File-Header signature");
        }
        entry.filename = await this.tokenizer.readToken(new StringType(entry.filenameLength, "utf-8")), 
        await this.tokenizer.ignore(entry.extraFieldLength), await this.tokenizer.ignore(entry.fileCommentLength), 
        files.push(entry), debug(`Add central-directory file-entry: n=${n + 1}/${files.length}: filename=${files[n].filename}`);
      }
      return this.tokenizer.setPosition(pos), files;
    }
    this.tokenizer.setPosition(pos);
  }
  async unzip(fileCb) {
    const entries = await this.readCentralDirectory();
    if (entries) {
      return this.iterateOverCentralDirectory(entries, fileCb);
    }
    let stop = !1;
    do {
      const zipHeader = await this.readLocalFileHeader();
      if (!zipHeader) {
        break;
      }
      const next = fileCb(zipHeader);
      let fileData;
      if (stop = !!next.stop, await this.tokenizer.ignore(zipHeader.extraFieldLength), 
      zipHeader.dataDescriptor && 0 === zipHeader.compressedSize) {
        const chunks = [];
        let len = 262144;
        debug("Compressed-file-size unknown, scanning for next data-descriptor-signature....");
        let nextHeaderIndex = -1;
        for (;nextHeaderIndex < 0 && 262144 === len; ) {
          len = await this.tokenizer.peekBuffer(this.syncBuffer, {
            mayBeLess: !0
          }), nextHeaderIndex = indexOf(this.syncBuffer.subarray(0, len), ddSignatureArray);
          const size = nextHeaderIndex >= 0 ? nextHeaderIndex : len;
          if (next.handler) {
            const data = new Uint8Array(size);
            await this.tokenizer.readBuffer(data), chunks.push(data);
          } else {
            await this.tokenizer.ignore(size);
          }
        }
        debug(`Found data-descriptor-signature at pos=${this.tokenizer.position}`), next.handler && await this.inflate(zipHeader, mergeArrays(chunks), next.handler);
      } else {
        next.handler ? (debug(`Reading compressed-file-data: ${zipHeader.compressedSize} bytes`), 
        fileData = new Uint8Array(zipHeader.compressedSize), await this.tokenizer.readBuffer(fileData), 
        await this.inflate(zipHeader, fileData, next.handler)) : (debug(`Ignoring compressed-file-data: ${zipHeader.compressedSize} bytes`), 
        await this.tokenizer.ignore(zipHeader.compressedSize));
      }
      if (debug(`Reading data-descriptor at pos=${this.tokenizer.position}`), zipHeader.dataDescriptor) {
        if (134695760 !== (await this.tokenizer.readToken(DataDescriptor)).signature) {
          throw new Error("Expected data-descriptor-signature at position " + (this.tokenizer.position - DataDescriptor.len));
        }
      }
    } while (!stop);
  }
  async iterateOverCentralDirectory(entries, fileCb) {
    for (const fileHeader of entries) {
      const next = fileCb(fileHeader);
      if (next.handler) {
        this.tokenizer.setPosition(fileHeader.relativeOffsetOfLocalHeader);
        const zipHeader = await this.readLocalFileHeader();
        if (zipHeader) {
          await this.tokenizer.ignore(zipHeader.extraFieldLength);
          const fileData = new Uint8Array(fileHeader.compressedSize);
          await this.tokenizer.readBuffer(fileData), await this.inflate(zipHeader, fileData, next.handler);
        }
      }
      if (next.stop) {
        break;
      }
    }
  }
  async inflate(zipHeader, fileData, cb) {
    if (0 === zipHeader.compressedMethod) {
      return cb(fileData);
    }
    if (8 !== zipHeader.compressedMethod) {
      throw new Error(`Unsupported ZIP compression method: ${zipHeader.compressedMethod}`);
    }
    debug(`Decompress filename=${zipHeader.filename}, compressed-size=${fileData.length}`);
    return cb(await ZipHandler.decompressDeflateRaw(fileData));
  }
  static async decompressDeflateRaw(data) {
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(data), controller.close();
      }
    }), ds = new DecompressionStream("deflate-raw"), output = input.pipeThrough(ds);
    try {
      const response = new Response(output), buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (err) {
      const message = err instanceof Error ? `Failed to deflate ZIP entry: ${err.message}` : "Unknown decompression error in ZIP entry";
      throw new TypeError(message);
    }
  }
  async readLocalFileHeader() {
    const signature = await this.tokenizer.peekToken(UINT32_LE);
    if (signature === Signature_LocalFileHeader) {
      const header = await this.tokenizer.readToken(LocalFileHeaderToken);
      return header.filename = await this.tokenizer.readToken(new StringType(header.filenameLength, "utf-8")), 
      header;
    }
    if (signature === Signature_CentralFileHeader) {
      return !1;
    }
    if (3759263696 === signature) {
      throw new Error("Encrypted ZIP");
    }
    throw new Error("Unexpected signature");
  }
}

function indexOf(buffer, portion) {
  const bufferLength = buffer.length, portionLength = portion.length;
  if (portionLength > bufferLength) {
    return -1;
  }
  for (let i = 0; i <= bufferLength - portionLength; i++) {
    let found = !0;
    for (let j = 0; j < portionLength; j++) {
      if (buffer[i + j] !== portion[j]) {
        found = !1;
        break;
      }
    }
    if (found) {
      return i;
    }
  }
  return -1;
}

function mergeArrays(chunks) {
  const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0), mergedArray = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    mergedArray.set(chunk, offset), offset += chunk.length;
  }
  return mergedArray;
}

class GzipHandler {
  constructor(tokenizer) {
    this.tokenizer = tokenizer;
  }
  inflate() {
    const tokenizer = this.tokenizer;
    return new ReadableStream({
      async pull(controller) {
        const buffer = new Uint8Array(1024), size = await tokenizer.readBuffer(buffer, {
          mayBeLess: !0
        });
        0 !== size ? controller.enqueue(buffer.subarray(0, size)) : controller.close();
      }
    }).pipeThrough(new DecompressionStream("gzip"));
  }
}

function getUintBE(view) {
  const {byteLength: byteLength} = view;
  return 6 === byteLength ? view.getUint16(0) * 2 ** 32 + view.getUint32(2) : 5 === byteLength ? view.getUint8(0) * 2 ** 32 + view.getUint32(1) : 4 === byteLength ? view.getUint32(0) : 3 === byteLength ? 65536 * view.getUint8(0) + view.getUint16(1) : 2 === byteLength ? view.getUint16(0) : 1 === byteLength ? view.getUint8(0) : void 0;
}

new globalThis.TextDecoder("utf8"), new globalThis.TextEncoder, Array.from({
  length: 256
}, (_, index) => index.toString(16).padStart(2, "0"));

const uint32SyncSafeToken = {
  get: (buffer, offset) => 127 & buffer[offset + 3] | buffer[offset + 2] << 7 | buffer[offset + 1] << 14 | buffer[offset] << 21,
  len: 4
}, recoverableZipErrorMessages = new Set([ "Unexpected signature", "Encrypted ZIP", "Expected Central-File-Header signature" ]), recoverableZipErrorMessagePrefixes = [ "ZIP entry count exceeds ", "Unsupported ZIP compression method:", "ZIP entry compressed data exceeds ", "ZIP entry decompressed data exceeds ", "Expected data-descriptor-signature at position " ], recoverableZipErrorCodes = new Set([ "Z_BUF_ERROR", "Z_DATA_ERROR", "ERR_INVALID_STATE" ]);

class ParserHardLimitError extends Error {}

function getSafeBound(value, maximum, reason) {
  if (!Number.isFinite(value) || value < 0 || value > maximum) {
    throw new ParserHardLimitError(`${reason} has invalid size ${value} (maximum ${maximum} bytes)`);
  }
  return value;
}

async function safeIgnore(tokenizer, length, {maximumLength: maximumLength = 16777216, reason: reason = "skip"} = {}) {
  const safeLength = getSafeBound(length, maximumLength, reason);
  await tokenizer.ignore(safeLength);
}

async function safeReadBuffer(tokenizer, buffer, options, {maximumLength: maximumLength = buffer.length, reason: reason = "read"} = {}) {
  const safeLength = getSafeBound(buffer.length, maximumLength, reason);
  return tokenizer.readBuffer(buffer, {
    ...options,
    length: safeLength
  });
}

function findZipDataDescriptorOffset(buffer, bytesConsumed) {
  if (buffer.length < 16) {
    return -1;
  }
  const lastPossibleDescriptorOffset = buffer.length - 16;
  for (let index = 0; index <= lastPossibleDescriptorOffset; index++) {
    if (134695760 === UINT32_LE.get(buffer, index) && UINT32_LE.get(buffer, index + 8) === bytesConsumed + index) {
      return index;
    }
  }
  return -1;
}

function isPngAncillaryChunk(type) {
  return !!(32 & type.codePointAt(0));
}

async function readZipDataDescriptorEntryWithLimit(zipHandler, {shouldBuffer: shouldBuffer, maximumLength: maximumLength = 1048576} = {}) {
  const {syncBuffer: syncBuffer} = zipHandler, {length: syncBufferLength} = syncBuffer, chunks = [];
  let bytesConsumed = 0;
  for (;;) {
    const length = await zipHandler.tokenizer.peekBuffer(syncBuffer, {
      mayBeLess: !0
    }), dataDescriptorOffset = findZipDataDescriptorOffset(syncBuffer.subarray(0, length), bytesConsumed), retainedLength = dataDescriptorOffset >= 0 ? 0 : length === syncBufferLength ? Math.min(15, length - 1) : 0, chunkLength = dataDescriptorOffset >= 0 ? dataDescriptorOffset : length - retainedLength;
    if (0 === chunkLength) {
      break;
    }
    if (bytesConsumed += chunkLength, bytesConsumed > maximumLength) {
      throw new Error(`ZIP entry compressed data exceeds ${maximumLength} bytes`);
    }
    if (shouldBuffer) {
      const data = new Uint8Array(chunkLength);
      await zipHandler.tokenizer.readBuffer(data), chunks.push(data);
    } else {
      await zipHandler.tokenizer.ignore(chunkLength);
    }
    if (dataDescriptorOffset >= 0) {
      break;
    }
  }
  if (hasUnknownFileSize(zipHandler.tokenizer) || (zipHandler.knownSizeDescriptorScannedBytes += bytesConsumed), 
  shouldBuffer) {
    return function(chunks, totalLength) {
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset), offset += chunk.length;
      }
      return merged;
    }(chunks, bytesConsumed);
  }
}

function getRemainingZipScanBudget(zipHandler, startOffset) {
  return hasUnknownFileSize(zipHandler.tokenizer) ? Math.max(0, 16777216 - (zipHandler.tokenizer.position - startOffset)) : Math.max(0, 1048576 - zipHandler.knownSizeDescriptorScannedBytes);
}

async function readZipEntryData(zipHandler, zipHeader, {shouldBuffer: shouldBuffer, maximumDescriptorLength: maximumDescriptorLength = 1048576} = {}) {
  if (zipHeader.dataDescriptor && 0 === zipHeader.compressedSize) {
    return readZipDataDescriptorEntryWithLimit(zipHandler, {
      shouldBuffer: shouldBuffer,
      maximumLength: maximumDescriptorLength
    });
  }
  if (!shouldBuffer) {
    return void await safeIgnore(zipHandler.tokenizer, zipHeader.compressedSize, {
      maximumLength: hasUnknownFileSize(zipHandler.tokenizer) ? 1048576 : zipHandler.tokenizer.fileInfo.size,
      reason: "ZIP entry compressed data"
    });
  }
  const maximumLength = function(tokenizer) {
    const fileSize = tokenizer.fileInfo.size, remainingBytes = Number.isFinite(fileSize) ? Math.max(0, fileSize - tokenizer.position) : Number.MAX_SAFE_INTEGER;
    return Math.min(remainingBytes, 2147483647);
  }(zipHandler.tokenizer);
  if (!Number.isFinite(zipHeader.compressedSize) || zipHeader.compressedSize < 0 || zipHeader.compressedSize > maximumLength) {
    throw new Error(`ZIP entry compressed data exceeds ${maximumLength} bytes`);
  }
  const fileData = new Uint8Array(zipHeader.compressedSize);
  return await zipHandler.tokenizer.readBuffer(fileData), fileData;
}

function getFileTypeFromMimeType(mimeType) {
  switch (mimeType = mimeType.toLowerCase()) {
   case "application/epub+zip":
    return {
      ext: "epub",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.text":
    return {
      ext: "odt",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.text-template":
    return {
      ext: "ott",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.spreadsheet":
    return {
      ext: "ods",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.spreadsheet-template":
    return {
      ext: "ots",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.presentation":
    return {
      ext: "odp",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.presentation-template":
    return {
      ext: "otp",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.graphics":
    return {
      ext: "odg",
      mime: mimeType
    };

   case "application/vnd.oasis.opendocument.graphics-template":
    return {
      ext: "otg",
      mime: mimeType
    };

   case "application/vnd.openxmlformats-officedocument.presentationml.slideshow":
    return {
      ext: "ppsx",
      mime: mimeType
    };

   case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    return {
      ext: "xlsx",
      mime: mimeType
    };

   case "application/vnd.ms-excel.sheet.macroenabled":
    return {
      ext: "xlsm",
      mime: "application/vnd.ms-excel.sheet.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.spreadsheetml.template":
    return {
      ext: "xltx",
      mime: mimeType
    };

   case "application/vnd.ms-excel.template.macroenabled":
    return {
      ext: "xltm",
      mime: "application/vnd.ms-excel.template.macroenabled.12"
    };

   case "application/vnd.ms-powerpoint.slideshow.macroenabled":
    return {
      ext: "ppsm",
      mime: "application/vnd.ms-powerpoint.slideshow.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    return {
      ext: "docx",
      mime: mimeType
    };

   case "application/vnd.ms-word.document.macroenabled":
    return {
      ext: "docm",
      mime: "application/vnd.ms-word.document.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.wordprocessingml.template":
    return {
      ext: "dotx",
      mime: mimeType
    };

   case "application/vnd.ms-word.template.macroenabledtemplate":
    return {
      ext: "dotm",
      mime: "application/vnd.ms-word.template.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.presentationml.template":
    return {
      ext: "potx",
      mime: mimeType
    };

   case "application/vnd.ms-powerpoint.template.macroenabled":
    return {
      ext: "potm",
      mime: "application/vnd.ms-powerpoint.template.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    return {
      ext: "pptx",
      mime: mimeType
    };

   case "application/vnd.ms-powerpoint.presentation.macroenabled":
    return {
      ext: "pptm",
      mime: "application/vnd.ms-powerpoint.presentation.macroenabled.12"
    };

   case "application/vnd.ms-visio.drawing":
    return {
      ext: "vsdx",
      mime: "application/vnd.visio"
    };

   case "application/vnd.ms-package.3dmanufacturing-3dmodel+xml":
    return {
      ext: "3mf",
      mime: "model/3mf"
    };
  }
}

function _check(buffer, headers, options) {
  options = {
    offset: 0,
    ...options
  };
  for (const [index, header] of headers.entries()) {
    if (options.mask) {
      if (header !== (options.mask[index] & buffer[index + options.offset])) {
        return !1;
      }
    } else if (header !== buffer[index + options.offset]) {
      return !1;
    }
  }
  return !0;
}

function hasUnknownFileSize(tokenizer) {
  const fileSize = tokenizer.fileInfo.size;
  return !Number.isFinite(fileSize) || fileSize === Number.MAX_SAFE_INTEGER;
}

function hasExceededUnknownSizeScanBudget(tokenizer, startOffset, maximumBytes) {
  return hasUnknownFileSize(tokenizer) && tokenizer.position - startOffset > maximumBytes;
}

function canReadZipEntryForDetection(zipHeader, maximumSize = 1048576) {
  const sizes = [ zipHeader.compressedSize, zipHeader.uncompressedSize ];
  for (const size of sizes) {
    if (!Number.isFinite(size) || size < 0 || size > maximumSize) {
      return !1;
    }
  }
  return !0;
}

function getOpenXmlFileTypeFromZipEntries(openXmlState) {
  if (openXmlState.hasContentTypesEntry && !openXmlState.hasUnparseableContentTypes && !openXmlState.isParsingContentTypes && !openXmlState.hasParsedContentTypesEntry) {
    return openXmlState.hasWordDirectory ? {
      ext: "docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    } : openXmlState.hasPresentationDirectory ? {
      ext: "pptx",
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    } : openXmlState.hasSpreadsheetDirectory ? {
      ext: "xlsx",
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    } : openXmlState.hasThreeDimensionalModelEntry ? {
      ext: "3mf",
      mime: "model/3mf"
    } : void 0;
  }
}

ZipHandler.prototype.inflate = async function(zipHeader, fileData, callback) {
  if (0 === zipHeader.compressedMethod) {
    return callback(fileData);
  }
  if (8 !== zipHeader.compressedMethod) {
    throw new Error(`Unsupported ZIP compression method: ${zipHeader.compressedMethod}`);
  }
  return callback(await async function(data, {maximumLength: maximumLength = 1048576} = {}) {
    const reader = new ReadableStream({
      start(controller) {
        controller.enqueue(data), controller.close();
      }
    }).pipeThrough(new DecompressionStream("deflate-raw")).getReader(), chunks = [];
    let totalLength = 0;
    try {
      for (;;) {
        const {done: done, value: value} = await reader.read();
        if (done) {
          break;
        }
        if (totalLength += value.length, totalLength > maximumLength) {
          throw await reader.cancel(), new Error(`ZIP entry decompressed data exceeds ${maximumLength} bytes`);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const uncompressedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      uncompressedData.set(chunk, offset), offset += chunk.length;
    }
    return uncompressedData;
  }(fileData, {
    maximumLength: 1048576
  }));
}, ZipHandler.prototype.unzip = async function(fileCallback) {
  let stop = !1, zipEntryCount = 0;
  const zipScanStart = this.tokenizer.position;
  this.knownSizeDescriptorScannedBytes = 0;
  do {
    if (hasExceededUnknownSizeScanBudget(this.tokenizer, zipScanStart, 16777216)) {
      throw new ParserHardLimitError("ZIP stream probing exceeds 16777216 bytes");
    }
    const zipHeader = await this.readLocalFileHeader();
    if (!zipHeader) {
      break;
    }
    if (zipEntryCount++, zipEntryCount > 1024) {
      throw new Error("ZIP entry count exceeds 1024");
    }
    const next = fileCallback(zipHeader);
    stop = Boolean(next.stop), await this.tokenizer.ignore(zipHeader.extraFieldLength);
    const fileData = await readZipEntryData(this, zipHeader, {
      shouldBuffer: Boolean(next.handler),
      maximumDescriptorLength: Math.min(1048576, getRemainingZipScanBudget(this, zipScanStart))
    });
    if (next.handler && await this.inflate(zipHeader, fileData, next.handler), zipHeader.dataDescriptor) {
      const dataDescriptor = new Uint8Array(16);
      if (await this.tokenizer.readBuffer(dataDescriptor), 134695760 !== UINT32_LE.get(dataDescriptor, 0)) {
        throw new Error("Expected data-descriptor-signature at position " + (this.tokenizer.position - dataDescriptor.length));
      }
    }
    if (hasExceededUnknownSizeScanBudget(this.tokenizer, zipScanStart, 16777216)) {
      throw new ParserHardLimitError("ZIP stream probing exceeds 16777216 bytes");
    }
  } while (!stop);
};

class FileTypeParser {
  constructor(options) {
    const normalizedMpegOffsetTolerance = (mpegOffsetTolerance = options?.mpegOffsetTolerance, 
    Number.isFinite(mpegOffsetTolerance) ? Math.max(0, Math.min(4098, Math.trunc(mpegOffsetTolerance))) : 0);
    var mpegOffsetTolerance;
    this.options = {
      ...options,
      mpegOffsetTolerance: normalizedMpegOffsetTolerance
    }, this.detectors = [ ...this.options.customDetectors ?? [], {
      id: "core",
      detect: this.detectConfident
    }, {
      id: "core.imprecise",
      detect: this.detectImprecise
    } ], this.tokenizerOptions = {
      abortSignal: this.options.signal
    }, this.gzipProbeDepth = 0;
  }
  getTokenizerOptions() {
    return {
      ...this.tokenizerOptions
    };
  }
  createTokenizerFromWebStream(stream) {
    return function(tokenizer) {
      const streamReader = tokenizer?.streamReader;
      if ("WebStreamByobReader" !== streamReader?.constructor?.name) {
        return tokenizer;
      }
      const {reader: reader} = streamReader, cancelAndRelease = async () => {
        await reader.cancel(), reader.releaseLock();
      };
      return streamReader.close = cancelAndRelease, streamReader.abort = async () => {
        streamReader.interrupted = !0, await cancelAndRelease();
      }, tokenizer;
    }(fromWebStream(stream, this.getTokenizerOptions()));
  }
  async parseTokenizer(tokenizer, detectionReentryCount = 0) {
    this.detectionReentryCount = detectionReentryCount;
    const initialPosition = tokenizer.position;
    for (const detector of this.detectors) {
      let fileType;
      try {
        fileType = await detector.detect(tokenizer);
      } catch (error) {
        if (error instanceof EndOfStreamError) {
          return;
        }
        if (error instanceof ParserHardLimitError) {
          return;
        }
        throw error;
      }
      if (fileType) {
        return fileType;
      }
      if (initialPosition !== tokenizer.position) {
        return;
      }
    }
  }
  async fromTokenizer(tokenizer) {
    try {
      return await this.parseTokenizer(tokenizer);
    } finally {
      await tokenizer.close();
    }
  }
  async fromBuffer(input) {
    if (!(input instanceof Uint8Array || input instanceof ArrayBuffer)) {
      throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof input}\``);
    }
    const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);
    var uint8Array, options;
    if (buffer?.length > 1) {
      return this.fromTokenizer((uint8Array = buffer, options = this.getTokenizerOptions(), 
      new BufferTokenizer(uint8Array, options)));
    }
  }
  async fromBlob(blob) {
    this.options.signal?.throwIfAborted();
    const tokenizer = function(blob, options) {
      return new BlobTokenizer(blob, options);
    }(blob, this.getTokenizerOptions());
    return this.fromTokenizer(tokenizer);
  }
  async fromStream(stream) {
    this.options.signal?.throwIfAborted();
    const tokenizer = this.createTokenizerFromWebStream(stream);
    return this.fromTokenizer(tokenizer);
  }
  async toDetectionStream(stream, options) {
    const sampleSize = function(sampleSize) {
      return Number.isFinite(sampleSize) ? Math.max(1, Math.trunc(sampleSize)) : 4100;
    }(options?.sampleSize ?? 4100);
    let detectedFileType, firstChunk;
    const reader = stream.getReader({
      mode: "byob"
    });
    try {
      const {value: chunk, done: done} = await function(reader, buffer, signal) {
        return void 0 === signal ? reader.read(buffer) : (signal.throwIfAborted(), new Promise((resolve, reject) => {
          const cleanup = () => {
            signal.removeEventListener("abort", onAbort);
          }, onAbort = () => {
            const abortReason = signal.reason;
            cleanup(), (async () => {
              try {
                await reader.cancel(abortReason);
              } catch {}
            })(), reject(abortReason);
          };
          signal.addEventListener("abort", onAbort, {
            once: !0
          }), (async () => {
            try {
              const result = await reader.read(buffer);
              cleanup(), resolve(result);
            } catch (error) {
              cleanup(), reject(error);
            }
          })();
        }));
      }(reader, new Uint8Array(sampleSize), this.options.signal);
      if (firstChunk = chunk, !done && chunk) {
        try {
          detectedFileType = await this.fromBuffer(chunk.subarray(0, sampleSize));
        } catch (error) {
          if (!(error instanceof EndOfStreamError)) {
            throw error;
          }
          detectedFileType = void 0;
        }
      }
      firstChunk = chunk;
    } finally {
      reader.releaseLock();
    }
    const transformStream = new TransformStream({
      async start(controller) {
        controller.enqueue(firstChunk);
      },
      transform(chunk, controller) {
        controller.enqueue(chunk);
      }
    }), newStream = stream.pipeThrough(transformStream);
    return newStream.fileType = detectedFileType, newStream;
  }
  async detectGzip(tokenizer) {
    if (this.gzipProbeDepth >= 1) {
      return {
        ext: "gz",
        mime: "application/gzip"
      };
    }
    const limitedInflatedStream = function(stream, maximumBytes) {
      const reader = stream.getReader();
      let emittedBytes = 0, sourceDone = !1, sourceCanceled = !1;
      const cancelSource = async reason => {
        sourceDone || sourceCanceled || (sourceCanceled = !0, await reader.cancel(reason));
      };
      return new ReadableStream({
        async pull(controller) {
          if (emittedBytes >= maximumBytes) {
            return controller.close(), void await cancelSource();
          }
          const {done: done, value: value} = await reader.read();
          if (done || !value) {
            return sourceDone = !0, void controller.close();
          }
          const remainingBytes = maximumBytes - emittedBytes;
          if (value.length > remainingBytes) {
            return controller.enqueue(value.subarray(0, remainingBytes)), emittedBytes += remainingBytes, 
            controller.close(), void await cancelSource();
          }
          controller.enqueue(value), emittedBytes += value.length;
        },
        async cancel(reason) {
          await cancelSource(reason);
        }
      });
    }(new GzipHandler(tokenizer).inflate(), 16777216), hasUnknownSize = hasUnknownFileSize(tokenizer);
    let timeout, probeSignal, probeParser, compressedFileType;
    if (hasUnknownSize) {
      const timeoutController = new AbortController;
      timeout = setTimeout(() => {
        timeoutController.abort(new DOMException("Operation timed out after 100 ms", "TimeoutError"));
      }, 100), probeSignal = void 0 === this.options.signal ? timeoutController.signal : AbortSignal.any([ this.options.signal, timeoutController.signal ]), 
      probeParser = new FileTypeParser({
        ...this.options,
        signal: probeSignal
      }), probeParser.gzipProbeDepth = this.gzipProbeDepth + 1;
    } else {
      this.gzipProbeDepth++;
    }
    try {
      compressedFileType = await (probeParser ?? this).fromStream(limitedInflatedStream);
    } catch (error) {
      if ("AbortError" === error?.name && "TimeoutError" !== probeSignal?.reason?.name) {
        throw error;
      }
    } finally {
      clearTimeout(timeout), hasUnknownSize || this.gzipProbeDepth--;
    }
    return "tar" === compressedFileType?.ext ? {
      ext: "tar.gz",
      mime: "application/gzip"
    } : {
      ext: "gz",
      mime: "application/gzip"
    };
  }
  check(header, options) {
    return _check(this.buffer, header, options);
  }
  checkString(header, options) {
    return this.check(function(string, encoding) {
      if ("utf-16le" === encoding) {
        const bytes = [];
        for (let index = 0; index < string.length; index++) {
          const code = string.charCodeAt(index);
          bytes.push(255 & code, code >> 8 & 255);
        }
        return bytes;
      }
      if ("utf-16be" === encoding) {
        const bytes = [];
        for (let index = 0; index < string.length; index++) {
          const code = string.charCodeAt(index);
          bytes.push(code >> 8 & 255, 255 & code);
        }
        return bytes;
      }
      return [ ...string ].map(character => character.charCodeAt(0));
    }(header, options?.encoding), options);
  }
  detectConfident=async tokenizer => {
    if (this.buffer = new Uint8Array(4100), void 0 === tokenizer.fileInfo.size && (tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER), 
    this.tokenizer = tokenizer, hasUnknownFileSize(tokenizer) && (await tokenizer.peekBuffer(this.buffer, {
      length: 3,
      mayBeLess: !0
    }), this.check([ 31, 139, 8 ]))) {
      return this.detectGzip(tokenizer);
    }
    if (await tokenizer.peekBuffer(this.buffer, {
      length: 32,
      mayBeLess: !0
    }), this.check([ 66, 77 ])) {
      return {
        ext: "bmp",
        mime: "image/bmp"
      };
    }
    if (this.check([ 11, 119 ])) {
      return {
        ext: "ac3",
        mime: "audio/vnd.dolby.dd-raw"
      };
    }
    if (this.check([ 120, 1 ])) {
      return {
        ext: "dmg",
        mime: "application/x-apple-diskimage"
      };
    }
    if (this.check([ 77, 90 ])) {
      return {
        ext: "exe",
        mime: "application/x-msdownload"
      };
    }
    if (this.check([ 37, 33 ])) {
      return await tokenizer.peekBuffer(this.buffer, {
        length: 24,
        mayBeLess: !0
      }), this.checkString("PS-Adobe-", {
        offset: 2
      }) && this.checkString(" EPSF-", {
        offset: 14
      }) ? {
        ext: "eps",
        mime: "application/eps"
      } : {
        ext: "ps",
        mime: "application/postscript"
      };
    }
    if (this.check([ 31, 160 ]) || this.check([ 31, 157 ])) {
      return {
        ext: "Z",
        mime: "application/x-compress"
      };
    }
    if (this.check([ 199, 113 ])) {
      return {
        ext: "cpio",
        mime: "application/x-cpio"
      };
    }
    if (this.check([ 96, 234 ])) {
      return {
        ext: "arj",
        mime: "application/x-arj"
      };
    }
    if (this.check([ 239, 187, 191 ])) {
      if (this.detectionReentryCount >= 256) {
        return;
      }
      return this.detectionReentryCount++, await this.tokenizer.ignore(3), this.detectConfident(tokenizer);
    }
    if (this.check([ 71, 73, 70 ])) {
      return {
        ext: "gif",
        mime: "image/gif"
      };
    }
    if (this.check([ 73, 73, 188 ])) {
      return {
        ext: "jxr",
        mime: "image/vnd.ms-photo"
      };
    }
    if (this.check([ 31, 139, 8 ])) {
      return this.detectGzip(tokenizer);
    }
    if (this.check([ 66, 90, 104 ])) {
      return {
        ext: "bz2",
        mime: "application/x-bzip2"
      };
    }
    if (this.checkString("ID3")) {
      await safeIgnore(tokenizer, 6, {
        maximumLength: 6,
        reason: "ID3 header prefix"
      });
      const id3HeaderLength = await tokenizer.readToken(uint32SyncSafeToken), isUnknownFileSize = hasUnknownFileSize(tokenizer);
      if (!Number.isFinite(id3HeaderLength) || id3HeaderLength < 0 || isUnknownFileSize && (id3HeaderLength > 16777216 || tokenizer.position + id3HeaderLength > 16777216)) {
        return;
      }
      if (tokenizer.position + id3HeaderLength > tokenizer.fileInfo.size) {
        if (isUnknownFileSize) {
          return;
        }
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      }
      try {
        await safeIgnore(tokenizer, id3HeaderLength, {
          maximumLength: isUnknownFileSize ? 16777216 : tokenizer.fileInfo.size,
          reason: "ID3 payload"
        });
      } catch (error) {
        if (error instanceof EndOfStreamError) {
          return;
        }
        throw error;
      }
      if (this.detectionReentryCount >= 256) {
        return;
      }
      return this.detectionReentryCount++, this.parseTokenizer(tokenizer, this.detectionReentryCount);
    }
    if (this.checkString("MP+")) {
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    }
    if ((67 === this.buffer[0] || 70 === this.buffer[0]) && this.check([ 87, 83 ], {
      offset: 1
    })) {
      return {
        ext: "swf",
        mime: "application/x-shockwave-flash"
      };
    }
    if (this.check([ 255, 216, 255 ])) {
      return this.check([ 247 ], {
        offset: 3
      }) ? {
        ext: "jls",
        mime: "image/jls"
      } : {
        ext: "jpg",
        mime: "image/jpeg"
      };
    }
    if (this.check([ 79, 98, 106, 1 ])) {
      return {
        ext: "avro",
        mime: "application/avro"
      };
    }
    if (this.checkString("FLIF")) {
      return {
        ext: "flif",
        mime: "image/flif"
      };
    }
    if (this.checkString("8BPS")) {
      return {
        ext: "psd",
        mime: "image/vnd.adobe.photoshop"
      };
    }
    if (this.checkString("MPCK")) {
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    }
    if (this.checkString("FORM")) {
      return {
        ext: "aif",
        mime: "audio/aiff"
      };
    }
    if (this.checkString("icns", {
      offset: 0
    })) {
      return {
        ext: "icns",
        mime: "image/icns"
      };
    }
    if (this.check([ 80, 75, 3, 4 ])) {
      let fileType;
      const openXmlState = {
        hasContentTypesEntry: !1,
        hasParsedContentTypesEntry: !1,
        isParsingContentTypes: !1,
        hasUnparseableContentTypes: !1,
        hasWordDirectory: !1,
        hasPresentationDirectory: !1,
        hasSpreadsheetDirectory: !1,
        hasThreeDimensionalModelEntry: !1
      };
      try {
        await new ZipHandler(tokenizer).unzip(zipHeader => {
          !function(openXmlState, filename) {
            filename.startsWith("word/") && (openXmlState.hasWordDirectory = !0), filename.startsWith("ppt/") && (openXmlState.hasPresentationDirectory = !0), 
            filename.startsWith("xl/") && (openXmlState.hasSpreadsheetDirectory = !0), filename.startsWith("3D/") && filename.endsWith(".model") && (openXmlState.hasThreeDimensionalModelEntry = !0);
          }(openXmlState, zipHeader.filename);
          const isOpenXmlContentTypesEntry = "[Content_Types].xml" === zipHeader.filename, openXmlFileTypeFromEntries = getOpenXmlFileTypeFromZipEntries(openXmlState);
          if (!isOpenXmlContentTypesEntry && openXmlFileTypeFromEntries) {
            return fileType = openXmlFileTypeFromEntries, {
              stop: !0
            };
          }
          switch (zipHeader.filename) {
           case "META-INF/mozilla.rsa":
            return fileType = {
              ext: "xpi",
              mime: "application/x-xpinstall"
            }, {
              stop: !0
            };

           case "META-INF/MANIFEST.MF":
            return fileType = {
              ext: "jar",
              mime: "application/java-archive"
            }, {
              stop: !0
            };

           case "mimetype":
            return canReadZipEntryForDetection(zipHeader, 1048576) ? {
              async handler(fileData) {
                const mimeType = new TextDecoder("utf-8").decode(fileData).trim();
                fileType = getFileTypeFromMimeType(mimeType);
              },
              stop: !0
            } : {};

           case "[Content_Types].xml":
            return openXmlState.hasContentTypesEntry = !0, canReadZipEntryForDetection(zipHeader, 1048576) ? (openXmlState.isParsingContentTypes = !0, 
            {
              async handler(fileData) {
                const mimeType = function(xmlContent) {
                  const endPosition = xmlContent.indexOf('.main+xml"');
                  if (-1 === endPosition) {
                    const mimeType = "application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
                    return xmlContent.includes(`ContentType="${mimeType}"`) ? mimeType : void 0;
                  }
                  const truncatedContent = xmlContent.slice(0, endPosition), firstQuotePosition = truncatedContent.lastIndexOf('"');
                  return truncatedContent.slice(firstQuotePosition + 1);
                }(new TextDecoder("utf-8").decode(fileData));
                mimeType && (fileType = getFileTypeFromMimeType(mimeType)), openXmlState.hasParsedContentTypesEntry = !0, 
                openXmlState.isParsingContentTypes = !1;
              },
              stop: !0
            }) : (openXmlState.hasUnparseableContentTypes = !0, {});

           default:
            return /classes\d*\.dex/.test(zipHeader.filename) ? (fileType = {
              ext: "apk",
              mime: "application/vnd.android.package-archive"
            }, {
              stop: !0
            }) : {};
          }
        });
      } catch (error) {
        if (!function(error) {
          if (error instanceof EndOfStreamError) {
            return !0;
          }
          if (error instanceof ParserHardLimitError) {
            return !0;
          }
          if (!(error instanceof Error)) {
            return !1;
          }
          if (recoverableZipErrorMessages.has(error.message)) {
            return !0;
          }
          if (recoverableZipErrorCodes.has(error.code)) {
            return !0;
          }
          for (const prefix of recoverableZipErrorMessagePrefixes) {
            if (error.message.startsWith(prefix)) {
              return !0;
            }
          }
          return !1;
        }(error)) {
          throw error;
        }
        openXmlState.isParsingContentTypes && (openXmlState.isParsingContentTypes = !1, 
        openXmlState.hasUnparseableContentTypes = !0);
      }
      return fileType ?? getOpenXmlFileTypeFromZipEntries(openXmlState) ?? {
        ext: "zip",
        mime: "application/zip"
      };
    }
    if (this.checkString("OggS")) {
      await tokenizer.ignore(28);
      const type = new Uint8Array(8);
      return await tokenizer.readBuffer(type), _check(type, [ 79, 112, 117, 115, 72, 101, 97, 100 ]) ? {
        ext: "opus",
        mime: "audio/ogg; codecs=opus"
      } : _check(type, [ 128, 116, 104, 101, 111, 114, 97 ]) ? {
        ext: "ogv",
        mime: "video/ogg"
      } : _check(type, [ 1, 118, 105, 100, 101, 111, 0 ]) ? {
        ext: "ogm",
        mime: "video/ogg"
      } : _check(type, [ 127, 70, 76, 65, 67 ]) ? {
        ext: "oga",
        mime: "audio/ogg"
      } : _check(type, [ 83, 112, 101, 101, 120, 32, 32 ]) ? {
        ext: "spx",
        mime: "audio/ogg"
      } : _check(type, [ 1, 118, 111, 114, 98, 105, 115 ]) ? {
        ext: "ogg",
        mime: "audio/ogg"
      } : {
        ext: "ogx",
        mime: "application/ogg"
      };
    }
    if (this.check([ 80, 75 ]) && (3 === this.buffer[2] || 5 === this.buffer[2] || 7 === this.buffer[2]) && (4 === this.buffer[3] || 6 === this.buffer[3] || 8 === this.buffer[3])) {
      return {
        ext: "zip",
        mime: "application/zip"
      };
    }
    if (this.checkString("MThd")) {
      return {
        ext: "mid",
        mime: "audio/midi"
      };
    }
    if (this.checkString("wOFF") && (this.check([ 0, 1, 0, 0 ], {
      offset: 4
    }) || this.checkString("OTTO", {
      offset: 4
    }))) {
      return {
        ext: "woff",
        mime: "font/woff"
      };
    }
    if (this.checkString("wOF2") && (this.check([ 0, 1, 0, 0 ], {
      offset: 4
    }) || this.checkString("OTTO", {
      offset: 4
    }))) {
      return {
        ext: "woff2",
        mime: "font/woff2"
      };
    }
    if (this.check([ 212, 195, 178, 161 ]) || this.check([ 161, 178, 195, 212 ])) {
      return {
        ext: "pcap",
        mime: "application/vnd.tcpdump.pcap"
      };
    }
    if (this.checkString("DSD ")) {
      return {
        ext: "dsf",
        mime: "audio/x-dsf"
      };
    }
    if (this.checkString("LZIP")) {
      return {
        ext: "lz",
        mime: "application/x-lzip"
      };
    }
    if (this.checkString("fLaC")) {
      return {
        ext: "flac",
        mime: "audio/flac"
      };
    }
    if (this.check([ 66, 80, 71, 251 ])) {
      return {
        ext: "bpg",
        mime: "image/bpg"
      };
    }
    if (this.checkString("wvpk")) {
      return {
        ext: "wv",
        mime: "audio/wavpack"
      };
    }
    if (this.checkString("%PDF")) {
      return {
        ext: "pdf",
        mime: "application/pdf"
      };
    }
    if (this.check([ 0, 97, 115, 109 ])) {
      return {
        ext: "wasm",
        mime: "application/wasm"
      };
    }
    if (this.check([ 73, 73 ])) {
      const fileType = await this.readTiffHeader(!1);
      if (fileType) {
        return fileType;
      }
    }
    if (this.check([ 77, 77 ])) {
      const fileType = await this.readTiffHeader(!0);
      if (fileType) {
        return fileType;
      }
    }
    if (this.checkString("MAC ")) {
      return {
        ext: "ape",
        mime: "audio/ape"
      };
    }
    if (this.check([ 26, 69, 223, 163 ])) {
      async function readField() {
        const msb = await tokenizer.peekNumber(UINT8);
        let mask = 128, ic = 0;
        for (;0 === (msb & mask) && 0 !== mask; ) {
          ++ic, mask >>= 1;
        }
        const id = new Uint8Array(ic + 1);
        return await safeReadBuffer(tokenizer, id, void 0, {
          maximumLength: id.length,
          reason: "EBML field"
        }), id;
      }
      async function readElement() {
        const idField = await readField(), lengthField = await readField();
        lengthField[0] ^= 128 >> lengthField.length - 1;
        const nrLength = Math.min(6, lengthField.length), idView = new DataView(idField.buffer), lengthView = new DataView(lengthField.buffer, lengthField.length - nrLength, nrLength);
        return {
          id: getUintBE(idView),
          len: getUintBE(lengthView)
        };
      }
      async function readChildren(children) {
        let ebmlElementCount = 0;
        for (;children > 0; ) {
          if (ebmlElementCount++, ebmlElementCount > 256) {
            return;
          }
          if (hasExceededUnknownSizeScanBudget(tokenizer, ebmlScanStart, 16777216)) {
            return;
          }
          const previousPosition = tokenizer.position, element = await readElement();
          if (17026 === element.id) {
            if (element.len > 64) {
              return;
            }
            const documentTypeLength = getSafeBound(element.len, 64, "EBML DocType");
            return (await tokenizer.readToken(new StringType(documentTypeLength))).replaceAll(/\00.*$/g, "");
          }
          if (hasUnknownFileSize(tokenizer) && (!Number.isFinite(element.len) || element.len < 0 || element.len > 1048576)) {
            return;
          }
          if (await safeIgnore(tokenizer, element.len, {
            maximumLength: hasUnknownFileSize(tokenizer) ? 1048576 : tokenizer.fileInfo.size,
            reason: "EBML payload"
          }), --children, tokenizer.position <= previousPosition) {
            return;
          }
        }
      }
      const rootElement = await readElement(), ebmlScanStart = tokenizer.position;
      switch (await readChildren(rootElement.len)) {
       case "webm":
        return {
          ext: "webm",
          mime: "video/webm"
        };

       case "matroska":
        return {
          ext: "mkv",
          mime: "video/matroska"
        };

       default:
        return;
      }
    }
    if (this.checkString("SQLi")) {
      return {
        ext: "sqlite",
        mime: "application/x-sqlite3"
      };
    }
    if (this.check([ 78, 69, 83, 26 ])) {
      return {
        ext: "nes",
        mime: "application/x-nintendo-nes-rom"
      };
    }
    if (this.checkString("Cr24")) {
      return {
        ext: "crx",
        mime: "application/x-google-chrome-extension"
      };
    }
    if (this.checkString("MSCF") || this.checkString("ISc(")) {
      return {
        ext: "cab",
        mime: "application/vnd.ms-cab-compressed"
      };
    }
    if (this.check([ 237, 171, 238, 219 ])) {
      return {
        ext: "rpm",
        mime: "application/x-rpm"
      };
    }
    if (this.check([ 197, 208, 211, 198 ])) {
      return {
        ext: "eps",
        mime: "application/eps"
      };
    }
    if (this.check([ 40, 181, 47, 253 ])) {
      return {
        ext: "zst",
        mime: "application/zstd"
      };
    }
    if (this.check([ 127, 69, 76, 70 ])) {
      return {
        ext: "elf",
        mime: "application/x-elf"
      };
    }
    if (this.check([ 33, 66, 68, 78 ])) {
      return {
        ext: "pst",
        mime: "application/vnd.ms-outlook"
      };
    }
    if (this.checkString("PAR1") || this.checkString("PARE")) {
      return {
        ext: "parquet",
        mime: "application/vnd.apache.parquet"
      };
    }
    if (this.checkString("ttcf")) {
      return {
        ext: "ttc",
        mime: "font/collection"
      };
    }
    if (this.check([ 254, 237, 250, 206 ]) || this.check([ 254, 237, 250, 207 ]) || this.check([ 206, 250, 237, 254 ]) || this.check([ 207, 250, 237, 254 ])) {
      return {
        ext: "macho",
        mime: "application/x-mach-binary"
      };
    }
    if (this.check([ 4, 34, 77, 24 ])) {
      return {
        ext: "lz4",
        mime: "application/x-lz4"
      };
    }
    if (this.checkString("regf")) {
      return {
        ext: "dat",
        mime: "application/x-ft-windows-registry-hive"
      };
    }
    if (this.checkString("$FL2") || this.checkString("$FL3")) {
      return {
        ext: "sav",
        mime: "application/x-spss-sav"
      };
    }
    if (this.check([ 79, 84, 84, 79, 0 ])) {
      return {
        ext: "otf",
        mime: "font/otf"
      };
    }
    if (this.checkString("#!AMR")) {
      return {
        ext: "amr",
        mime: "audio/amr"
      };
    }
    if (this.checkString("{\\rtf")) {
      return {
        ext: "rtf",
        mime: "application/rtf"
      };
    }
    if (this.check([ 70, 76, 86, 1 ])) {
      return {
        ext: "flv",
        mime: "video/x-flv"
      };
    }
    if (this.checkString("IMPM")) {
      return {
        ext: "it",
        mime: "audio/x-it"
      };
    }
    if (this.checkString("-lh0-", {
      offset: 2
    }) || this.checkString("-lh1-", {
      offset: 2
    }) || this.checkString("-lh2-", {
      offset: 2
    }) || this.checkString("-lh3-", {
      offset: 2
    }) || this.checkString("-lh4-", {
      offset: 2
    }) || this.checkString("-lh5-", {
      offset: 2
    }) || this.checkString("-lh6-", {
      offset: 2
    }) || this.checkString("-lh7-", {
      offset: 2
    }) || this.checkString("-lzs-", {
      offset: 2
    }) || this.checkString("-lz4-", {
      offset: 2
    }) || this.checkString("-lz5-", {
      offset: 2
    }) || this.checkString("-lhd-", {
      offset: 2
    })) {
      return {
        ext: "lzh",
        mime: "application/x-lzh-compressed"
      };
    }
    if (this.check([ 0, 0, 1, 186 ])) {
      if (this.check([ 33 ], {
        offset: 4,
        mask: [ 241 ]
      })) {
        return {
          ext: "mpg",
          mime: "video/MP1S"
        };
      }
      if (this.check([ 68 ], {
        offset: 4,
        mask: [ 196 ]
      })) {
        return {
          ext: "mpg",
          mime: "video/MP2P"
        };
      }
    }
    if (this.checkString("ITSF")) {
      return {
        ext: "chm",
        mime: "application/vnd.ms-htmlhelp"
      };
    }
    if (this.check([ 202, 254, 186, 190 ])) {
      const machOArchitectureCount = UINT32_BE.get(this.buffer, 4), javaClassFileMajorVersion = UINT16_BE.get(this.buffer, 6);
      if (machOArchitectureCount > 0 && machOArchitectureCount <= 30) {
        return {
          ext: "macho",
          mime: "application/x-mach-binary"
        };
      }
      if (javaClassFileMajorVersion > 30) {
        return {
          ext: "class",
          mime: "application/java-vm"
        };
      }
    }
    if (this.checkString(".RMF")) {
      return {
        ext: "rm",
        mime: "application/vnd.rn-realmedia"
      };
    }
    if (this.checkString("DRACO")) {
      return {
        ext: "drc",
        mime: "application/vnd.google.draco"
      };
    }
    if (this.check([ 253, 55, 122, 88, 90, 0 ])) {
      return {
        ext: "xz",
        mime: "application/x-xz"
      };
    }
    if (this.checkString("<?xml ")) {
      return {
        ext: "xml",
        mime: "application/xml"
      };
    }
    if (this.check([ 55, 122, 188, 175, 39, 28 ])) {
      return {
        ext: "7z",
        mime: "application/x-7z-compressed"
      };
    }
    if (this.check([ 82, 97, 114, 33, 26, 7 ]) && (0 === this.buffer[6] || 1 === this.buffer[6])) {
      return {
        ext: "rar",
        mime: "application/x-rar-compressed"
      };
    }
    if (this.checkString("solid ")) {
      return {
        ext: "stl",
        mime: "model/stl"
      };
    }
    if (this.checkString("AC")) {
      const version = new StringType(4, "latin1").get(this.buffer, 2);
      if (version.match("^d*") && version >= 1e3 && version <= 1050) {
        return {
          ext: "dwg",
          mime: "image/vnd.dwg"
        };
      }
    }
    if (this.checkString("070707")) {
      return {
        ext: "cpio",
        mime: "application/x-cpio"
      };
    }
    if (this.checkString("BLENDER")) {
      return {
        ext: "blend",
        mime: "application/x-blender"
      };
    }
    if (this.checkString("!<arch>")) {
      await tokenizer.ignore(8);
      return "debian-binary" === await tokenizer.readToken(new StringType(13, "ascii")) ? {
        ext: "deb",
        mime: "application/x-deb"
      } : {
        ext: "ar",
        mime: "application/x-unix-archive"
      };
    }
    if (this.checkString("WEBVTT") && [ "\n", "\r", "\t", " ", "\0" ].some(char7 => this.checkString(char7, {
      offset: 6
    }))) {
      return {
        ext: "vtt",
        mime: "text/vtt"
      };
    }
    if (this.check([ 137, 80, 78, 71, 13, 10, 26, 10 ])) {
      const pngFileType = {
        ext: "png",
        mime: "image/png"
      }, apngFileType = {
        ext: "apng",
        mime: "image/apng"
      };
      async function readChunkHeader() {
        return {
          length: await tokenizer.readToken(INT32_BE),
          type: await tokenizer.readToken(new StringType(4, "latin1"))
        };
      }
      await tokenizer.ignore(8);
      const isUnknownPngStream = hasUnknownFileSize(tokenizer), pngScanStart = tokenizer.position;
      let pngChunkCount = 0, hasSeenImageHeader = !1;
      do {
        if (pngChunkCount++, pngChunkCount > 512) {
          break;
        }
        if (hasExceededUnknownSizeScanBudget(tokenizer, pngScanStart, 16777216)) {
          break;
        }
        const previousPosition = tokenizer.position, chunk = await readChunkHeader();
        if (chunk.length < 0) {
          return;
        }
        if ("IHDR" === chunk.type) {
          if (13 !== chunk.length) {
            return;
          }
          hasSeenImageHeader = !0;
        }
        switch (chunk.type) {
         case "IDAT":
          return pngFileType;

         case "acTL":
          return apngFileType;

         default:
          if (!hasSeenImageHeader && "CgBI" !== chunk.type) {
            return;
          }
          if (isUnknownPngStream && chunk.length > 1048576) {
            return hasSeenImageHeader && isPngAncillaryChunk(chunk.type) ? pngFileType : void 0;
          }
          try {
            await safeIgnore(tokenizer, chunk.length + 4, {
              maximumLength: isUnknownPngStream ? 1048580 : tokenizer.fileInfo.size,
              reason: "PNG chunk payload"
            });
          } catch (error) {
            if (!isUnknownPngStream && (error instanceof ParserHardLimitError || error instanceof EndOfStreamError)) {
              return pngFileType;
            }
            throw error;
          }
        }
        if (tokenizer.position <= previousPosition) {
          break;
        }
      } while (tokenizer.position + 8 < tokenizer.fileInfo.size);
      return pngFileType;
    }
    if (this.check([ 65, 82, 82, 79, 87, 49, 0, 0 ])) {
      return {
        ext: "arrow",
        mime: "application/vnd.apache.arrow.file"
      };
    }
    if (this.check([ 103, 108, 84, 70, 2, 0, 0, 0 ])) {
      return {
        ext: "glb",
        mime: "model/gltf-binary"
      };
    }
    if (this.check([ 102, 114, 101, 101 ], {
      offset: 4
    }) || this.check([ 109, 100, 97, 116 ], {
      offset: 4
    }) || this.check([ 109, 111, 111, 118 ], {
      offset: 4
    }) || this.check([ 119, 105, 100, 101 ], {
      offset: 4
    })) {
      return {
        ext: "mov",
        mime: "video/quicktime"
      };
    }
    if (this.check([ 73, 73, 82, 79, 8, 0, 0, 0, 24 ])) {
      return {
        ext: "orf",
        mime: "image/x-olympus-orf"
      };
    }
    if (this.checkString("gimp xcf ")) {
      return {
        ext: "xcf",
        mime: "image/x-xcf"
      };
    }
    if (this.checkString("ftyp", {
      offset: 4
    }) && 96 & this.buffer[8]) {
      const brandMajor = new StringType(4, "latin1").get(this.buffer, 8).replace("\0", " ").trim();
      switch (brandMajor) {
       case "avif":
       case "avis":
        return {
          ext: "avif",
          mime: "image/avif"
        };

       case "mif1":
        return {
          ext: "heic",
          mime: "image/heif"
        };

       case "msf1":
        return {
          ext: "heic",
          mime: "image/heif-sequence"
        };

       case "heic":
       case "heix":
        return {
          ext: "heic",
          mime: "image/heic"
        };

       case "hevc":
       case "hevx":
        return {
          ext: "heic",
          mime: "image/heic-sequence"
        };

       case "qt":
        return {
          ext: "mov",
          mime: "video/quicktime"
        };

       case "M4V":
       case "M4VH":
       case "M4VP":
        return {
          ext: "m4v",
          mime: "video/x-m4v"
        };

       case "M4P":
        return {
          ext: "m4p",
          mime: "video/mp4"
        };

       case "M4B":
        return {
          ext: "m4b",
          mime: "audio/mp4"
        };

       case "M4A":
        return {
          ext: "m4a",
          mime: "audio/x-m4a"
        };

       case "F4V":
        return {
          ext: "f4v",
          mime: "video/mp4"
        };

       case "F4P":
        return {
          ext: "f4p",
          mime: "video/mp4"
        };

       case "F4A":
        return {
          ext: "f4a",
          mime: "audio/mp4"
        };

       case "F4B":
        return {
          ext: "f4b",
          mime: "audio/mp4"
        };

       case "crx":
        return {
          ext: "cr3",
          mime: "image/x-canon-cr3"
        };

       default:
        return brandMajor.startsWith("3g") ? brandMajor.startsWith("3g2") ? {
          ext: "3g2",
          mime: "video/3gpp2"
        } : {
          ext: "3gp",
          mime: "video/3gpp"
        } : {
          ext: "mp4",
          mime: "video/mp4"
        };
      }
    }
    if (this.checkString("REGEDIT4\r\n")) {
      return {
        ext: "reg",
        mime: "application/x-ms-regedit"
      };
    }
    if (this.check([ 82, 73, 70, 70 ])) {
      if (this.checkString("WEBP", {
        offset: 8
      })) {
        return {
          ext: "webp",
          mime: "image/webp"
        };
      }
      if (this.check([ 65, 86, 73 ], {
        offset: 8
      })) {
        return {
          ext: "avi",
          mime: "video/vnd.avi"
        };
      }
      if (this.check([ 87, 65, 86, 69 ], {
        offset: 8
      })) {
        return {
          ext: "wav",
          mime: "audio/wav"
        };
      }
      if (this.check([ 81, 76, 67, 77 ], {
        offset: 8
      })) {
        return {
          ext: "qcp",
          mime: "audio/qcelp"
        };
      }
    }
    if (this.check([ 73, 73, 85, 0, 24, 0, 0, 0, 136, 231, 116, 216 ])) {
      return {
        ext: "rw2",
        mime: "image/x-panasonic-rw2"
      };
    }
    if (this.check([ 48, 38, 178, 117, 142, 102, 207, 17, 166, 217 ])) {
      let isMalformedAsf = !1;
      try {
        async function readHeader() {
          const guid = new Uint8Array(16);
          return await safeReadBuffer(tokenizer, guid, void 0, {
            maximumLength: guid.length,
            reason: "ASF header GUID"
          }), {
            id: guid,
            size: Number(await tokenizer.readToken(UINT64_LE))
          };
        }
        await safeIgnore(tokenizer, 30, {
          maximumLength: 30,
          reason: "ASF header prelude"
        });
        const isUnknownFileSize = hasUnknownFileSize(tokenizer), asfHeaderScanStart = tokenizer.position;
        let asfHeaderObjectCount = 0;
        for (;tokenizer.position + 24 < tokenizer.fileInfo.size && (asfHeaderObjectCount++, 
        !(asfHeaderObjectCount > 512)) && !hasExceededUnknownSizeScanBudget(tokenizer, asfHeaderScanStart, 16777216); ) {
          const previousPosition = tokenizer.position, header = await readHeader();
          let payload = header.size - 24;
          if (!Number.isFinite(payload) || payload < 0) {
            isMalformedAsf = !0;
            break;
          }
          if (_check(header.id, [ 145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101 ])) {
            const typeId = new Uint8Array(16);
            if (payload -= await safeReadBuffer(tokenizer, typeId, void 0, {
              maximumLength: typeId.length,
              reason: "ASF stream type GUID"
            }), _check(typeId, [ 64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43 ])) {
              return {
                ext: "asf",
                mime: "audio/x-ms-asf"
              };
            }
            if (_check(typeId, [ 192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43 ])) {
              return {
                ext: "asf",
                mime: "video/x-ms-asf"
              };
            }
            break;
          }
          if (isUnknownFileSize && payload > 1048576) {
            isMalformedAsf = !0;
            break;
          }
          if (await safeIgnore(tokenizer, payload, {
            maximumLength: isUnknownFileSize ? 1048576 : tokenizer.fileInfo.size,
            reason: "ASF header payload"
          }), tokenizer.position <= previousPosition) {
            isMalformedAsf = !0;
            break;
          }
        }
      } catch (error) {
        if (!(error instanceof EndOfStreamError || error instanceof ParserHardLimitError)) {
          throw error;
        }
        hasUnknownFileSize(tokenizer) && (isMalformedAsf = !0);
      }
      if (isMalformedAsf) {
        return;
      }
      return {
        ext: "asf",
        mime: "application/vnd.ms-asf"
      };
    }
    if (this.check([ 171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10 ])) {
      return {
        ext: "ktx",
        mime: "image/ktx"
      };
    }
    if ((this.check([ 126, 16, 4 ]) || this.check([ 126, 24, 4 ])) && this.check([ 48, 77, 73, 69 ], {
      offset: 4
    })) {
      return {
        ext: "mie",
        mime: "application/x-mie"
      };
    }
    if (this.check([ 39, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], {
      offset: 2
    })) {
      return {
        ext: "shp",
        mime: "application/x-esri-shape"
      };
    }
    if (this.check([ 255, 79, 255, 81 ])) {
      return {
        ext: "j2c",
        mime: "image/j2c"
      };
    }
    if (this.check([ 0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10 ])) {
      await tokenizer.ignore(20);
      switch (await tokenizer.readToken(new StringType(4, "ascii"))) {
       case "jp2 ":
        return {
          ext: "jp2",
          mime: "image/jp2"
        };

       case "jpx ":
        return {
          ext: "jpx",
          mime: "image/jpx"
        };

       case "jpm ":
        return {
          ext: "jpm",
          mime: "image/jpm"
        };

       case "mjp2":
        return {
          ext: "mj2",
          mime: "image/mj2"
        };

       default:
        return;
      }
    }
    if (this.check([ 255, 10 ]) || this.check([ 0, 0, 0, 12, 74, 88, 76, 32, 13, 10, 135, 10 ])) {
      return {
        ext: "jxl",
        mime: "image/jxl"
      };
    }
    if (this.check([ 254, 255 ])) {
      return this.checkString("<?xml ", {
        offset: 2,
        encoding: "utf-16be"
      }) ? {
        ext: "xml",
        mime: "application/xml"
      } : void 0;
    }
    if (this.check([ 208, 207, 17, 224, 161, 177, 26, 225 ])) {
      return {
        ext: "cfb",
        mime: "application/x-cfb"
      };
    }
    if (await tokenizer.peekBuffer(this.buffer, {
      length: Math.min(256, tokenizer.fileInfo.size),
      mayBeLess: !0
    }), this.check([ 97, 99, 115, 112 ], {
      offset: 36
    })) {
      return {
        ext: "icc",
        mime: "application/vnd.iccprofile"
      };
    }
    if (this.checkString("**ACE", {
      offset: 7
    }) && this.checkString("**", {
      offset: 12
    })) {
      return {
        ext: "ace",
        mime: "application/x-ace-compressed"
      };
    }
    if (this.checkString("BEGIN:")) {
      if (this.checkString("VCARD", {
        offset: 6
      })) {
        return {
          ext: "vcf",
          mime: "text/vcard"
        };
      }
      if (this.checkString("VCALENDAR", {
        offset: 6
      })) {
        return {
          ext: "ics",
          mime: "text/calendar"
        };
      }
    }
    if (this.checkString("FUJIFILMCCD-RAW")) {
      return {
        ext: "raf",
        mime: "image/x-fujifilm-raf"
      };
    }
    if (this.checkString("Extended Module:")) {
      return {
        ext: "xm",
        mime: "audio/x-xm"
      };
    }
    if (this.checkString("Creative Voice File")) {
      return {
        ext: "voc",
        mime: "audio/x-voc"
      };
    }
    if (this.check([ 4, 0, 0, 0 ]) && this.buffer.length >= 16) {
      const jsonSize = new DataView(this.buffer.buffer).getUint32(12, !0);
      if (jsonSize > 12 && this.buffer.length >= jsonSize + 16) {
        try {
          const header = (new TextDecoder).decode(this.buffer.subarray(16, jsonSize + 16));
          if (JSON.parse(header).files) {
            return {
              ext: "asar",
              mime: "application/x-asar"
            };
          }
        } catch {}
      }
    }
    if (this.check([ 6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2 ])) {
      return {
        ext: "mxf",
        mime: "application/mxf"
      };
    }
    if (this.checkString("SCRM", {
      offset: 44
    })) {
      return {
        ext: "s3m",
        mime: "audio/x-s3m"
      };
    }
    if (this.check([ 71 ]) && this.check([ 71 ], {
      offset: 188
    })) {
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    }
    if (this.check([ 71 ], {
      offset: 4
    }) && this.check([ 71 ], {
      offset: 196
    })) {
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    }
    if (this.check([ 66, 79, 79, 75, 77, 79, 66, 73 ], {
      offset: 60
    })) {
      return {
        ext: "mobi",
        mime: "application/x-mobipocket-ebook"
      };
    }
    if (this.check([ 68, 73, 67, 77 ], {
      offset: 128
    })) {
      return {
        ext: "dcm",
        mime: "application/dicom"
      };
    }
    if (this.check([ 76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70 ])) {
      return {
        ext: "lnk",
        mime: "application/x.ms.shortcut"
      };
    }
    if (this.check([ 98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0 ])) {
      return {
        ext: "alias",
        mime: "application/x.apple.alias"
      };
    }
    if (this.checkString("Kaydara FBX Binary  \0")) {
      return {
        ext: "fbx",
        mime: "application/x.autodesk.fbx"
      };
    }
    if (this.check([ 76, 80 ], {
      offset: 34
    }) && (this.check([ 0, 0, 1 ], {
      offset: 8
    }) || this.check([ 1, 0, 2 ], {
      offset: 8
    }) || this.check([ 2, 0, 2 ], {
      offset: 8
    }))) {
      return {
        ext: "eot",
        mime: "application/vnd.ms-fontobject"
      };
    }
    if (this.check([ 6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29 ])) {
      return {
        ext: "indd",
        mime: "application/x-indesign"
      };
    }
    if (this.check([ 255, 255, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 1, 0, 1, 0 ]) || this.check([ 0, 0, 255, 255, 0, 0, 0, 7, 0, 0, 0, 4, 0, 1, 0, 1 ])) {
      return {
        ext: "jmp",
        mime: "application/x-jmp-data"
      };
    }
    if (await tokenizer.peekBuffer(this.buffer, {
      length: Math.min(512, tokenizer.fileInfo.size),
      mayBeLess: !0
    }), this.checkString("ustar", {
      offset: 257
    }) && (this.checkString("\0", {
      offset: 262
    }) || this.checkString(" ", {
      offset: 262
    })) || this.check([ 0, 0, 0, 0, 0, 0 ], {
      offset: 257
    }) && function(arrayBuffer, offset = 0) {
      const readSum = Number.parseInt(new StringType(6).get(arrayBuffer, 148).replace(/\0.*$/, "").trim(), 8);
      if (Number.isNaN(readSum)) {
        return !1;
      }
      let sum = 256;
      for (let index = offset; index < offset + 148; index++) {
        sum += arrayBuffer[index];
      }
      for (let index = offset + 156; index < offset + 512; index++) {
        sum += arrayBuffer[index];
      }
      return readSum === sum;
    }(this.buffer)) {
      return {
        ext: "tar",
        mime: "application/x-tar"
      };
    }
    if (this.check([ 255, 254 ])) {
      const encoding = "utf-16le";
      return this.checkString("<?xml ", {
        offset: 2,
        encoding: encoding
      }) ? {
        ext: "xml",
        mime: "application/xml"
      } : this.check([ 255, 14 ], {
        offset: 2
      }) && this.checkString("SketchUp Model", {
        offset: 4,
        encoding: encoding
      }) ? {
        ext: "skp",
        mime: "application/vnd.sketchup.skp"
      } : this.checkString("Windows Registry Editor Version 5.00\r\n", {
        offset: 2,
        encoding: encoding
      }) ? {
        ext: "reg",
        mime: "application/x-ms-regedit"
      } : void 0;
    }
    return this.checkString("-----BEGIN PGP MESSAGE-----") ? {
      ext: "pgp",
      mime: "application/pgp-encrypted"
    } : void 0;
  };
  detectImprecise=async tokenizer => {
    this.buffer = new Uint8Array(4100);
    const fileSize = function(fileSize) {
      return Number.isFinite(fileSize) ? Math.max(0, fileSize) : Number.MAX_SAFE_INTEGER;
    }(tokenizer.fileInfo.size);
    if (await tokenizer.peekBuffer(this.buffer, {
      length: Math.min(8, fileSize),
      mayBeLess: !0
    }), this.check([ 0, 0, 1, 186 ]) || this.check([ 0, 0, 1, 179 ])) {
      return {
        ext: "mpg",
        mime: "video/mpeg"
      };
    }
    if (this.check([ 0, 1, 0, 0, 0 ])) {
      return {
        ext: "ttf",
        mime: "font/ttf"
      };
    }
    if (this.check([ 0, 0, 1, 0 ])) {
      return {
        ext: "ico",
        mime: "image/x-icon"
      };
    }
    if (this.check([ 0, 0, 2, 0 ])) {
      return {
        ext: "cur",
        mime: "image/x-icon"
      };
    }
    if (await tokenizer.peekBuffer(this.buffer, {
      length: Math.min(2 + this.options.mpegOffsetTolerance, fileSize),
      mayBeLess: !0
    }), this.buffer.length >= 2 + this.options.mpegOffsetTolerance) {
      for (let depth = 0; depth <= this.options.mpegOffsetTolerance; ++depth) {
        const type = this.scanMpeg(depth);
        if (type) {
          return type;
        }
      }
    }
  };
  async readTiffTag(bigEndian) {
    const tagId = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
    switch (await this.tokenizer.ignore(10), tagId) {
     case 50341:
      return {
        ext: "arw",
        mime: "image/x-sony-arw"
      };

     case 50706:
      return {
        ext: "dng",
        mime: "image/x-adobe-dng"
      };
    }
  }
  async readTiffIFD(bigEndian) {
    const numberOfTags = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
    if (!(numberOfTags > 512 || hasUnknownFileSize(this.tokenizer) && 2 + 12 * numberOfTags > 16777216)) {
      for (let n = 0; n < numberOfTags; ++n) {
        const fileType = await this.readTiffTag(bigEndian);
        if (fileType) {
          return fileType;
        }
      }
    }
  }
  async readTiffHeader(bigEndian) {
    const tiffFileType = {
      ext: "tif",
      mime: "image/tiff"
    }, version = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 2), ifdOffset = (bigEndian ? UINT32_BE : UINT32_LE).get(this.buffer, 4);
    if (42 === version) {
      if (ifdOffset >= 6) {
        if (this.checkString("CR", {
          offset: 8
        })) {
          return {
            ext: "cr2",
            mime: "image/x-canon-cr2"
          };
        }
        if (ifdOffset >= 8) {
          const someId1 = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 8), someId2 = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 10);
          if (28 === someId1 && 254 === someId2 || 31 === someId1 && 11 === someId2) {
            return {
              ext: "nef",
              mime: "image/x-nikon-nef"
            };
          }
        }
      }
      if (hasUnknownFileSize(this.tokenizer) && ifdOffset > 1048576) {
        return tiffFileType;
      }
      const maximumTiffOffset = hasUnknownFileSize(this.tokenizer) ? 16777216 : this.tokenizer.fileInfo.size;
      try {
        await safeIgnore(this.tokenizer, ifdOffset, {
          maximumLength: maximumTiffOffset,
          reason: "TIFF IFD offset"
        });
      } catch (error) {
        if (error instanceof EndOfStreamError) {
          return;
        }
        throw error;
      }
      let fileType;
      try {
        fileType = await this.readTiffIFD(bigEndian);
      } catch (error) {
        if (error instanceof EndOfStreamError) {
          return;
        }
        throw error;
      }
      return fileType ?? tiffFileType;
    }
    if (43 === version) {
      return tiffFileType;
    }
  }
  scanMpeg(offset) {
    if (this.check([ 255, 224 ], {
      offset: offset,
      mask: [ 255, 224 ]
    })) {
      if (this.check([ 16 ], {
        offset: offset + 1,
        mask: [ 22 ]
      })) {
        return this.check([ 8 ], {
          offset: offset + 1,
          mask: [ 8 ]
        }), {
          ext: "aac",
          mime: "audio/aac"
        };
      }
      if (this.check([ 2 ], {
        offset: offset + 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      }
      if (this.check([ 4 ], {
        offset: offset + 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      }
      if (this.check([ 6 ], {
        offset: offset + 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp1",
          mime: "audio/mpeg"
        };
      }
    }
  }
}

new Set([ "jpg", "png", "apng", "gif", "webp", "flif", "xcf", "cr2", "cr3", "orf", "arw", "dng", "nef", "rw2", "raf", "tif", "bmp", "icns", "jxr", "psd", "indd", "zip", "tar", "rar", "gz", "bz2", "7z", "dmg", "mp4", "mid", "mkv", "webm", "mov", "avi", "mpg", "mp2", "mp3", "m4a", "oga", "ogg", "ogv", "opus", "flac", "wav", "spx", "amr", "pdf", "epub", "elf", "macho", "exe", "swf", "rtf", "wasm", "woff", "woff2", "eot", "ttf", "otf", "ttc", "ico", "flv", "ps", "xz", "sqlite", "nes", "crx", "xpi", "cab", "deb", "ar", "rpm", "Z", "lz", "cfb", "mxf", "mts", "blend", "bpg", "docx", "pptx", "xlsx", "3gp", "3g2", "j2c", "jp2", "jpm", "jpx", "mj2", "aif", "qcp", "odt", "ods", "odp", "xml", "mobi", "heic", "cur", "ktx", "ape", "wv", "dcm", "ics", "glb", "pcap", "dsf", "lnk", "alias", "voc", "ac3", "m4v", "m4p", "m4b", "f4v", "f4p", "f4b", "f4a", "mie", "asf", "ogm", "ogx", "mpc", "arrow", "shp", "aac", "mp1", "it", "s3m", "xm", "skp", "avif", "eps", "lzh", "pgp", "asar", "stl", "chm", "3mf", "zst", "jxl", "vcf", "jls", "pst", "dwg", "parquet", "class", "arj", "cpio", "ace", "avro", "icc", "fbx", "vsdx", "vtt", "apk", "drc", "lz4", "potx", "xltx", "dotx", "xltm", "ott", "ots", "otp", "odg", "otg", "xlsm", "docm", "dotm", "potm", "pptm", "jar", "jmp", "rm", "sav", "ppsm", "ppsx", "tar.gz", "reg", "dat" ]), 
new Set([ "image/jpeg", "image/png", "image/gif", "image/webp", "image/flif", "image/x-xcf", "image/x-canon-cr2", "image/x-canon-cr3", "image/tiff", "image/bmp", "image/vnd.ms-photo", "image/vnd.adobe.photoshop", "application/x-indesign", "application/epub+zip", "application/x-xpinstall", "application/vnd.ms-powerpoint.slideshow.macroenabled.12", "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.presentation", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.slideshow", "application/zip", "application/x-tar", "application/x-rar-compressed", "application/gzip", "application/x-bzip2", "application/x-7z-compressed", "application/x-apple-diskimage", "application/vnd.apache.arrow.file", "video/mp4", "audio/midi", "video/matroska", "video/webm", "video/quicktime", "video/vnd.avi", "audio/wav", "audio/qcelp", "audio/x-ms-asf", "video/x-ms-asf", "application/vnd.ms-asf", "video/mpeg", "video/3gpp", "audio/mpeg", "audio/mp4", "video/ogg", "audio/ogg", "audio/ogg; codecs=opus", "application/ogg", "audio/flac", "audio/ape", "audio/wavpack", "audio/amr", "application/pdf", "application/x-elf", "application/x-mach-binary", "application/x-msdownload", "application/x-shockwave-flash", "application/rtf", "application/wasm", "font/woff", "font/woff2", "application/vnd.ms-fontobject", "font/ttf", "font/otf", "font/collection", "image/x-icon", "video/x-flv", "application/postscript", "application/eps", "application/x-xz", "application/x-sqlite3", "application/x-nintendo-nes-rom", "application/x-google-chrome-extension", "application/vnd.ms-cab-compressed", "application/x-deb", "application/x-unix-archive", "application/x-rpm", "application/x-compress", "application/x-lzip", "application/x-cfb", "application/x-mie", "application/mxf", "video/mp2t", "application/x-blender", "image/bpg", "image/j2c", "image/jp2", "image/jpx", "image/jpm", "image/mj2", "audio/aiff", "application/xml", "application/x-mobipocket-ebook", "image/heif", "image/heif-sequence", "image/heic", "image/heic-sequence", "image/icns", "image/ktx", "application/dicom", "audio/x-musepack", "text/calendar", "text/vcard", "text/vtt", "model/gltf-binary", "application/vnd.tcpdump.pcap", "audio/x-dsf", "application/x.ms.shortcut", "application/x.apple.alias", "audio/x-voc", "audio/vnd.dolby.dd-raw", "audio/x-m4a", "image/apng", "image/x-olympus-orf", "image/x-sony-arw", "image/x-adobe-dng", "image/x-nikon-nef", "image/x-panasonic-rw2", "image/x-fujifilm-raf", "video/x-m4v", "video/3gpp2", "application/x-esri-shape", "audio/aac", "audio/x-it", "audio/x-s3m", "audio/x-xm", "video/MP1S", "video/MP2P", "application/vnd.sketchup.skp", "image/avif", "application/x-lzh-compressed", "application/pgp-encrypted", "application/x-asar", "model/stl", "application/vnd.ms-htmlhelp", "model/3mf", "image/jxl", "application/zstd", "image/jls", "application/vnd.ms-outlook", "image/vnd.dwg", "application/vnd.apache.parquet", "application/java-vm", "application/x-arj", "application/x-cpio", "application/x-ace-compressed", "application/avro", "application/vnd.iccprofile", "application/x.autodesk.fbx", "application/vnd.visio", "application/vnd.android.package-archive", "application/vnd.google.draco", "application/x-lz4", "application/vnd.openxmlformats-officedocument.presentationml.template", "application/vnd.openxmlformats-officedocument.spreadsheetml.template", "application/vnd.openxmlformats-officedocument.wordprocessingml.template", "application/vnd.ms-excel.template.macroenabled.12", "application/vnd.oasis.opendocument.text-template", "application/vnd.oasis.opendocument.spreadsheet-template", "application/vnd.oasis.opendocument.presentation-template", "application/vnd.oasis.opendocument.graphics", "application/vnd.oasis.opendocument.graphics-template", "application/vnd.ms-excel.sheet.macroenabled.12", "application/vnd.ms-word.document.macroenabled.12", "application/vnd.ms-word.template.macroenabled.12", "application/vnd.ms-powerpoint.template.macroenabled.12", "application/vnd.ms-powerpoint.presentation.macroenabled.12", "application/java-archive", "application/vnd.rn-realmedia", "application/x-spss-sav", "application/x-ms-regedit", "application/x-ft-windows-registry-hive", "application/x-jmp-data" ]);

const imageExtensions = new Set([ "jpg", "png", "gif", "webp", "flif", "cr2", "tif", "bmp", "jxr", "psd", "ico", "bpg", "jp2", "jpm", "jpx", "heic", "cur", "dcm", "avif" ]);

async function imageType(input) {
  const result = await async function(input, options) {
    return new FileTypeParser(options).fromBuffer(input);
  }(input);
  return result && imageExtensions.has(result.ext) ? result : void 0;
}

function sleep(ms = 1e3) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

class FetchHTTPError extends Error {
  cause;
  url;
  status;
  responseText;
  constructor(url, status, responseText) {
    super(`Failed to fetch url ${url}: ${status}, ${responseText}`), this.name = "FetchHTTPError", 
    this.cause = responseText, this.url = url, this.status = status, this.responseText = responseText;
  }
}

const fetchArrayBufferOnce = async url => {
  const resp = await fetch(url);
  if (!resp.ok) {
    let text = "";
    try {
      text = await resp.text();
    } catch {}
    throw new FetchHTTPError(url, resp.status, text);
  }
  return (await resp.arrayBuffer()).transferToFixedLength();
}, getLibheifFactory = (() => {
  let _libheifFactory = null;
  return async function() {
    if (_libheifFactory) {
      return _libheifFactory;
    }
    Log.info("[MMM-OneDrive] [getLibheifFactory] Loading libheif-js wasm");
    const libheifWasmPath = require.resolve("libheif-js/libheif-wasm/libheif.wasm"), wasmBinary = fs.readFileSync(libheifWasmPath), factory = await libheifWASMModule({
      wasmBinary: wasmBinary
    });
    return await factory.ready, _libheifFactory = factory, factory;
  };
})();

const internetStatusListener = new node_events.EventEmitter;

class FileError extends Error {
  constructor(message) {
    super(message), this.name = "FileError";
  }
}

exports.createDirIfNotExists = async dir => {
  try {
    await fs$1.access(dir);
  } catch {
    await fs$1.mkdir(dir, {
      recursive: !0
    });
  }
}, exports.createIntervalRunner = function(render, interval) {
  const state = {
    stopped: !1,
    running: !1
  };
  let skipWait = null;
  async function cycle() {
    if (state.stopped) {
      state.running = !1;
    } else {
      state.running = !0;
      try {
        await render();
      } catch (err) {
        console.error("Error in render function in IntervalRunner:"), console.error(err);
      }
      await new Promise(resolve => {
        skipWait = resolve, setTimeout(resolve, interval);
      }), skipWait = null, state.stopped ? state.running = !1 : cycle();
    }
  }
  return cycle(), {
    skipToNext: () => {
      skipWait && (console.info("[IntervalRunner]: Skip to next cycle"), skipWait(null));
    },
    stop: () => {
      console.info("[IntervalRunner]: Stopping"), state.stopped = !0, skipWait && skipWait(null);
    },
    resume: () => {
      console.info("[IntervalRunner]: To resume"), state.running || (console.info("[IntervalRunner]: Resuming"), 
      state.stopped = !1, cycle());
    },
    state: () => ({
      ...state
    })
  };
}, exports.internetStatusListener = internetStatusListener, exports.urlToDisk = async (photo, dest, size) => {
  let photoArrayBuffer = await (async (url, maxRetries = 3) => {
    let attempt = 0;
    for (;attempt < maxRetries; ) {
      try {
        return await fetchArrayBufferOnce(url);
      } catch (err) {
        if (console.error(`Error fetching ${url}:`), console.error(err), console.warn(`Retrying fetchToUint8Array for ${url}, retry count: ${attempt}`), 
        ![ err instanceof TypeError && err.message.includes("Failed to fetch"), err instanceof FetchHTTPError ].some(Boolean)) {
          throw console.error(`Not retrying fetch for ${url} due to unknown error`), err;
        }
        attempt++, console.warn(`Fetch failed for ${url}, attempt ${attempt}/${maxRetries}.`), 
        await sleep(2e3);
      }
    }
    throw console.error(`Failed to fetch ${url} after ${maxRetries} attempts.`), new Error(`Failed to fetch url ${url} after ${maxRetries} attempts.`);
  })(photo.baseUrl);
  const imageType$1 = await imageType(photoArrayBuffer);
  if (!imageType$1) {
    throw new FileError(`Could not determine image type for ${photo.filename}`);
  }
  if (Log.debug(`[MMM-OneDrive] [urlToImageBase64] Image type: ${imageType$1.ext}, mimeType: ${imageType$1.mime}`), 
  "heic" === imageType$1.ext) {
    photoArrayBuffer = await (async ({filename: filename, data: data, size: size}) => {
      let heifDecoder, heifImages;
      try {
        Log.debug("[MMM-OneDrive] [convertHEIC]", {
          filename: filename
        });
        const d = Date.now();
        if (heifDecoder = new ((await getLibheifFactory()).HeifDecoder), heifImages = heifDecoder.decode(data), 
        !heifImages || 0 === heifImages.length) {
          throw new Error(`No HEIF images found in ${filename}.`);
        }
        const heifImage = heifImages[0], w = heifImage.get_width(), h = heifImage.get_height(), decodedData = await new Promise((resolve, reject) => {
          heifImage.display({
            data: new Uint8ClampedArray(w * h * 4)
          }, displayData => {
            if (!displayData) {
              return reject(new Error("HEIF processing error"));
            }
            resolve(displayData);
          });
        });
        let sharpBuffer = sharp(decodedData.data, {
          raw: {
            width: w,
            height: h,
            channels: 4
          }
        });
        size && size.width > 0 && size.height > 0 && (w > size.width || h > size.height) && (w > h ? (Log.debug("[MMM-OneDrive] [convertHEIC] resize w > h"), 
        sharpBuffer = sharpBuffer.resize(size.width)) : (Log.debug("[MMM-OneDrive] [convertHEIC] resize h > w"), 
        sharpBuffer = sharpBuffer.resize(null, size.height)));
        const jpegData = await sharpBuffer.jpeg({
          quality: 95,
          chromaSubsampling: "4:4:4"
        }).keepMetadata().toBuffer();
        Log.debug("[MMM-OneDrive] [convertHEIC] Done", {
          duration: Date.now() - d,
          size: void 0 !== size
        });
        const outputArraybuffer = new ArrayBuffer(jpegData.byteLength);
        return new Uint8Array(outputArraybuffer).set(new Uint8Array(jpegData)), outputArraybuffer;
      } catch (err) {
        throw Log.error("[MMM-OneDrive] [convertHEIC] Error", {
          filename: filename
        }), Log.error(err?.stack || err), err;
      } finally {
        if (heifImages && Array.isArray(heifImages)) {
          for (const heifImage of heifImages) {
            heifImage && heifImage.free();
          }
        }
        heifDecoder && heifDecoder.decoder.delete();
      }
    })({
      filename: photo.filename,
      data: photoArrayBuffer,
      size: size
    });
    if (!(buffer => {
      if (!buffer || buffer.byteLength < 3) {
        return !1;
      }
      const view = new Uint8Array(buffer);
      return 255 === view[0] && 216 === view[1] && 255 === view[2];
    })(photoArrayBuffer)) {
      throw new FileError(`The output of convertHEIC is not a valid JPG:\n                ${photo.filename}, mimeType: ${photo.mimeType}, url: ${photo.baseUrl}`);
    }
  }
  await fs$1.writeFile(dest, Buffer.from(photoArrayBuffer));
  return (await fs$1.stat(dest)).size;
};
