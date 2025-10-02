/*! *****************************************************************************
  mmm-onedrive
  Version 1.7.0

  MagicMirror² module to display your photos from OneDrive.
  Please submit bugs at https://github.com/hermanho/MMM-OneDrive/issues

  (c) hermanho
  Licence: MIT

  This file is auto-generated. Do not edit.
***************************************************************************** */

"use strict";

var require$$1 = require("tty"), require$$1$1 = require("util"), require$$0 = require("os"), Log = require("logger"), fs$1 = require("node:fs/promises"), sharp = require("sharp"), fs = require("fs"), libheifWASMModule = require("libheif-js/libheif-wasm/libheif.js");

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

function textDecode(bytes, encoding = "utf-8") {
  switch (encoding.toLowerCase()) {
   case "utf-8":
   case "utf8":
    return void 0 !== globalThis.TextDecoder ? new globalThis.TextDecoder("utf-8").decode(bytes) : function(bytes) {
      let out = "", i = 0;
      for (;i < bytes.length; ) {
        const b1 = bytes[i++];
        if (b1 < 128) {
          out += String.fromCharCode(b1);
        } else if (b1 < 224) {
          const b2 = 63 & bytes[i++];
          out += String.fromCharCode((31 & b1) << 6 | b2);
        } else if (b1 < 240) {
          const b2 = 63 & bytes[i++], b3 = 63 & bytes[i++];
          out += String.fromCharCode((15 & b1) << 12 | b2 << 6 | b3);
        } else {
          let cp = (7 & b1) << 18 | (63 & bytes[i++]) << 12 | (63 & bytes[i++]) << 6 | 63 & bytes[i++];
          cp -= 65536, out += String.fromCharCode(55296 + (cp >> 10 & 1023), 56320 + (1023 & cp));
        }
      }
      return out;
    }(bytes);

   case "utf-16le":
    return function(bytes) {
      let out = "";
      for (let i = 0; i < bytes.length; i += 2) {
        out += String.fromCharCode(bytes[i] | bytes[i + 1] << 8);
      }
      return out;
    }(bytes);

   case "ascii":
    return function(bytes) {
      return String.fromCharCode(...bytes.map(b => 127 & b));
    }(bytes);

   case "latin1":
   case "iso-8859-1":
    return function(bytes) {
      return String.fromCharCode(...bytes);
    }(bytes);

   case "windows-1252":
    return function(bytes) {
      let out = "";
      for (const b of bytes) {
        out += b >= 128 && b <= 159 && WINDOWS_1252_EXTRA[b] ? WINDOWS_1252_EXTRA[b] : String.fromCharCode(b);
      }
      return out;
    }(bytes);

   default:
    throw new RangeError(`Encoding '${encoding}' not supported`);
  }
}

function dv$1(array) {
  return new DataView(array.buffer, array.byteOffset);
}

const UINT8 = {
  len: 1,
  get: (array, offset) => dv$1(array).getUint8(offset),
  put: (array, offset, value) => (dv$1(array).setUint8(offset, value), offset + 1)
}, UINT16_LE$1 = {
  len: 2,
  get: (array, offset) => dv$1(array).getUint16(offset, !0),
  put: (array, offset, value) => (dv$1(array).setUint16(offset, value, !0), offset + 2)
}, UINT16_BE = {
  len: 2,
  get: (array, offset) => dv$1(array).getUint16(offset),
  put: (array, offset, value) => (dv$1(array).setUint16(offset, value), offset + 2)
}, UINT32_LE$1 = {
  len: 4,
  get: (array, offset) => dv$1(array).getUint32(offset, !0),
  put: (array, offset, value) => (dv$1(array).setUint32(offset, value, !0), offset + 4)
}, UINT32_BE = {
  len: 4,
  get: (array, offset) => dv$1(array).getUint32(offset),
  put: (array, offset, value) => (dv$1(array).setUint32(offset, value), offset + 4)
}, INT32_BE = {
  len: 4,
  get: (array, offset) => dv$1(array).getInt32(offset),
  put: (array, offset, value) => (dv$1(array).setInt32(offset, value), offset + 4)
}, UINT64_LE = {
  len: 8,
  get: (array, offset) => dv$1(array).getBigUint64(offset, !0),
  put: (array, offset, value) => (dv$1(array).setBigUint64(offset, value, !0), offset + 8)
};

let StringType$1 = class {
  constructor(len, encoding) {
    this.len = len, this.encoding = encoding;
  }
  get(data, offset = 0) {
    return textDecode(data.subarray(offset, offset + this.len), this.encoding);
  }
};

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

function dv(array) {
  return new DataView(array.buffer, array.byteOffset);
}

const UINT16_LE = {
  len: 2,
  get: (array, offset) => dv(array).getUint16(offset, !0),
  put: (array, offset, value) => (dv(array).setUint16(offset, value, !0), offset + 2)
}, UINT32_LE = {
  len: 4,
  get: (array, offset) => dv(array).getUint32(offset, !0),
  put: (array, offset, value) => (dv(array).setUint32(offset, value, !0), offset + 4)
};

class StringType {
  constructor(len, encoding) {
    this.len = len, this.encoding = encoding;
  }
  get(data, offset = 0) {
    return textDecode(data.subarray(offset, offset + this.len), this.encoding);
  }
}

var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array, fleb = new u8([ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0 ]), fdeb = new u8([ 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0 ]), clim = new u8([ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ]), freb = function(eb, start) {
  for (var b = new u16(31), i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return {
    b: b,
    r: r
  };
}, _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;

fl[28] = 258, revfl[258] = 28;

for (var fd = freb(fdeb, 0).b, rev = new u16(32768), i = 0; i < 32768; ++i) {
  var x = (43690 & i) >> 1 | (21845 & i) << 1;
  x = (61680 & (x = (52428 & x) >> 2 | (13107 & x) << 2)) >> 4 | (3855 & x) << 4, 
  rev[i] = ((65280 & x) >> 8 | (255 & x) << 8) >> 1;
}

var hMap = function(cd, mb, r) {
  for (var s = cd.length, i = 0, l = new u16(mb); i < s; ++i) {
    cd[i] && ++l[cd[i] - 1];
  }
  var co, le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        for (var sv = i << 4 | cd[i], r_1 = mb - cd[i], v = le[cd[i] - 1]++ << r_1, m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    for (co = new u16(s), i = 0; i < s; ++i) {
      cd[i] && (co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i]);
    }
  }
  return co;
}, flt = new u8(288);

for (i = 0; i < 144; ++i) {
  flt[i] = 8;
}

for (i = 144; i < 256; ++i) {
  flt[i] = 9;
}

for (i = 256; i < 280; ++i) {
  flt[i] = 7;
}

for (i = 280; i < 288; ++i) {
  flt[i] = 8;
}

var fdt = new u8(32);

for (i = 0; i < 32; ++i) {
  fdt[i] = 5;
}

var flrm = hMap(flt, 9, 1), fdrm = hMap(fdt, 5, 1), max = function(a) {
  for (var m = a[0], i = 1; i < a.length; ++i) {
    a[i] > m && (m = a[i]);
  }
  return m;
}, bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (7 & p) & m;
}, bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (7 & p);
}, shft = function(p) {
  return (p + 7) / 8 | 0;
}, ec = [ "unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", , "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data" ], err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  if (e.code = ind, Error.captureStackTrace && Error.captureStackTrace(e, err), !nt) {
    throw e;
  }
  return e;
}, inflt = function(dat, st, buf, dict) {
  var sl = dat.length;
  if (!sl || st.f && !st.l) {
    return buf || new u8(0);
  }
  var noBuf = !buf, resize = noBuf || 2 != st.i, noSt = st.i;
  noBuf && (buf = new u8(3 * sl));
  var cbuf = function(l) {
    var bl = buf.length;
    if (l > bl) {
      var nbuf = new u8(Math.max(2 * bl, l));
      nbuf.set(buf), buf = nbuf;
    }
  }, final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n, tbts = 8 * sl;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      if (pos += 3, !type) {
        var l = dat[(s = shft(pos) + 4) - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          noSt && err(0);
          break;
        }
        resize && cbuf(bt + l), buf.set(dat.subarray(s, t), bt), st.b = bt += l, st.p = pos = 8 * t, 
        st.f = final;
        continue;
      }
      if (1 == type) {
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      } else if (2 == type) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4, tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        for (var ldt = new u8(tl), clt = new u8(19), i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + 3 * i, 7);
        }
        pos += 3 * hcLen;
        var clb = max(clt), clbmsk = (1 << clb) - 1, clm = hMap(clt, clb, 1);
        for (i = 0; i < tl; ) {
          var s, r = clm[bits(dat, pos, clbmsk)];
          if (pos += 15 & r, (s = r >> 4) < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            for (16 == s ? (n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1]) : 17 == s ? (n = 3 + bits(dat, pos, 7), 
            pos += 3) : 18 == s && (n = 11 + bits(dat, pos, 127), pos += 7); n--; ) {
              ldt[i++] = c;
            }
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt), dbt = max(dt), lm = hMap(lt, lbt, 1), dm = hMap(dt, dbt, 1);
      } else {
        err(1);
      }
      if (pos > tbts) {
        noSt && err(0);
        break;
      }
    }
    resize && cbuf(bt + 131072);
    for (var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1, lpos = pos; ;lpos = pos) {
      var sym = (c = lm[bits16(dat, pos) & lms]) >> 4;
      if ((pos += 15 & c) > tbts) {
        noSt && err(0);
        break;
      }
      if (c || err(2), sym < 256) {
        buf[bt++] = sym;
      } else {
        if (256 == sym) {
          lpos = pos, lm = null;
          break;
        }
        var add = sym - 254;
        if (sym > 264) {
          var b = fleb[i = sym - 257];
          add = bits(dat, pos, (1 << b) - 1) + fl[i], pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        d || err(3), pos += 15 & d;
        dt = fd[dsym];
        if (dsym > 3) {
          b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          noSt && err(0);
          break;
        }
        resize && cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = 0 - dt, dend = Math.min(dt, end);
          for (shift + bt < 0 && err(3); bt < dend; ++bt) {
            buf[bt] = dict[shift + bt];
          }
        }
        for (;bt < end; ++bt) {
          buf[bt] = buf[bt - dt];
        }
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final, lm && (final = 1, st.m = lbt, st.d = dm, 
    st.n = dbt);
  } while (!final);
  return bt != buf.length && noBuf ? function(v, s, e) {
    return (null == e || e > v.length) && (e = v.length), new u8(v.subarray(s, e));
  }(buf, 0, bt) : buf.subarray(0, bt);
}, et = new u8(0);

function gunzipSync(data, opts) {
  var d, l, st = function(d) {
    31 == d[0] && 139 == d[1] && 8 == d[2] || err(6, "invalid gzip data");
    var flg = d[3], st = 10;
    4 & flg && (st += 2 + (d[10] | d[11] << 8));
    for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++]) {}
    return st + (2 & flg);
  }(data);
  return st + 8 > data.length && err(6, "invalid gzip data"), inflt(data.subarray(st, -8), {
    i: 2
  }, new u8((l = (d = data).length, (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0)), opts);
}

function unzlibSync(data, opts) {
  return inflt(data.subarray(((8 != (15 & (d = data)[0]) || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31) && err(6, "invalid zlib data"), 
  1 == (d[1] >> 5 & 1) && err(6, "invalid zlib data: " + (32 & d[1] ? "need" : "unexpected") + " dictionary"), 
  2 + (d[1] >> 3 & 4)), -4), {
    i: 2
  }, opts, opts);
  var d;
}

function decompressSync(data, opts) {
  return 31 == data[0] && 139 == data[1] && 8 == data[2] ? gunzipSync(data, opts) : 8 != (15 & data[0]) || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? function(data, opts) {
    return inflt(data, {
      i: 2
    }, opts, opts);
  }(data, opts) : unzlibSync(data, opts);
}

var td = "undefined" != typeof TextDecoder && new TextDecoder;

try {
  td.decode(et, {
    stream: !0
  });
} catch (e) {}

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
  get: array => (UINT16_LE.get(array, 6), {
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
          }), nextHeaderIndex = indexOf$1(this.syncBuffer.subarray(0, len), ddSignatureArray);
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
  inflate(zipHeader, fileData, cb) {
    if (0 === zipHeader.compressedMethod) {
      return cb(fileData);
    }
    debug(`Decompress filename=${zipHeader.filename}, compressed-size=${fileData.length}`);
    return cb(decompressSync(fileData));
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

function indexOf$1(buffer, portion) {
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
}, reasonableDetectionSizeInBytes = 4100;

function getFileTypeFromMimeType(mimeType) {
  switch (mimeType.toLowerCase()) {
   case "application/epub+zip":
    return {
      ext: "epub",
      mime: "application/epub+zip"
    };

   case "application/vnd.oasis.opendocument.text":
    return {
      ext: "odt",
      mime: "application/vnd.oasis.opendocument.text"
    };

   case "application/vnd.oasis.opendocument.text-template":
    return {
      ext: "ott",
      mime: "application/vnd.oasis.opendocument.text-template"
    };

   case "application/vnd.oasis.opendocument.spreadsheet":
    return {
      ext: "ods",
      mime: "application/vnd.oasis.opendocument.spreadsheet"
    };

   case "application/vnd.oasis.opendocument.spreadsheet-template":
    return {
      ext: "ots",
      mime: "application/vnd.oasis.opendocument.spreadsheet-template"
    };

   case "application/vnd.oasis.opendocument.presentation":
    return {
      ext: "odp",
      mime: "application/vnd.oasis.opendocument.presentation"
    };

   case "application/vnd.oasis.opendocument.presentation-template":
    return {
      ext: "otp",
      mime: "application/vnd.oasis.opendocument.presentation-template"
    };

   case "application/vnd.oasis.opendocument.graphics":
    return {
      ext: "odg",
      mime: "application/vnd.oasis.opendocument.graphics"
    };

   case "application/vnd.oasis.opendocument.graphics-template":
    return {
      ext: "otg",
      mime: "application/vnd.oasis.opendocument.graphics-template"
    };

   case "application/vnd.openxmlformats-officedocument.presentationml.slideshow":
    return {
      ext: "ppsx",
      mime: "application/vnd.openxmlformats-officedocument.presentationml.slideshow"
    };

   case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    return {
      ext: "xlsx",
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    };

   case "application/vnd.ms-excel.sheet.macroenabled":
    return {
      ext: "xlsm",
      mime: "application/vnd.ms-excel.sheet.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.spreadsheetml.template":
    return {
      ext: "xltx",
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.template"
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
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

   case "application/vnd.ms-word.document.macroenabled":
    return {
      ext: "docm",
      mime: "application/vnd.ms-word.document.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.wordprocessingml.template":
    return {
      ext: "dotx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.template"
    };

   case "application/vnd.ms-word.template.macroenabledtemplate":
    return {
      ext: "dotm",
      mime: "application/vnd.ms-word.template.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.presentationml.template":
    return {
      ext: "potx",
      mime: "application/vnd.openxmlformats-officedocument.presentationml.template"
    };

   case "application/vnd.ms-powerpoint.template.macroenabled":
    return {
      ext: "potm",
      mime: "application/vnd.ms-powerpoint.template.macroenabled.12"
    };

   case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    return {
      ext: "pptx",
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
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

class FileTypeParser {
  constructor(options) {
    this.detectors = [ ...options?.customDetectors ?? [], {
      id: "core",
      detect: this.detectConfident
    }, {
      id: "core.imprecise",
      detect: this.detectImprecise
    } ], this.tokenizerOptions = {
      abortSignal: options?.signal
    };
  }
  async fromTokenizer(tokenizer) {
    const initialPosition = tokenizer.position;
    for (const detector of this.detectors) {
      const fileType = await detector.detect(tokenizer);
      if (fileType) {
        return fileType;
      }
      if (initialPosition !== tokenizer.position) {
        return;
      }
    }
  }
  async fromBuffer(input) {
    if (!(input instanceof Uint8Array || input instanceof ArrayBuffer)) {
      throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof input}\``);
    }
    const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);
    var uint8Array, options;
    if (buffer?.length > 1) {
      return this.fromTokenizer((uint8Array = buffer, options = this.tokenizerOptions, 
      new BufferTokenizer(uint8Array, options)));
    }
  }
  async fromBlob(blob) {
    return this.fromStream(blob.stream());
  }
  async fromStream(stream) {
    const tokenizer = await fromWebStream(stream, this.tokenizerOptions);
    try {
      return await this.fromTokenizer(tokenizer);
    } finally {
      await tokenizer.close();
    }
  }
  async toDetectionStream(stream, options) {
    const {sampleSize: sampleSize = reasonableDetectionSizeInBytes} = options;
    let detectedFileType, firstChunk;
    const reader = stream.getReader({
      mode: "byob"
    });
    try {
      const {value: chunk, done: done} = await reader.read(new Uint8Array(sampleSize));
      if (firstChunk = chunk, !done && chunk) {
        try {
          detectedFileType = await this.fromBuffer(chunk.slice(0, sampleSize));
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
  check(header, options) {
    return _check(this.buffer, header, options);
  }
  checkString(header, options) {
    return this.check((string = header, [ ...string ].map(character => character.charCodeAt(0))), options);
    var string;
  }
  detectConfident=async tokenizer => {
    if (this.buffer = new Uint8Array(reasonableDetectionSizeInBytes), void 0 === tokenizer.fileInfo.size && (tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER), 
    this.tokenizer = tokenizer, await tokenizer.peekBuffer(this.buffer, {
      length: 12,
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
      return this.tokenizer.ignore(3), this.detectConfident(tokenizer);
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
      return {
        ext: "gz",
        mime: "application/gzip"
      };
    }
    if (this.check([ 66, 90, 104 ])) {
      return {
        ext: "bz2",
        mime: "application/x-bzip2"
      };
    }
    if (this.checkString("ID3")) {
      await tokenizer.ignore(6);
      const id3HeaderLength = await tokenizer.readToken(uint32SyncSafeToken);
      return tokenizer.position + id3HeaderLength > tokenizer.fileInfo.size ? {
        ext: "mp3",
        mime: "audio/mpeg"
      } : (await tokenizer.ignore(id3HeaderLength), this.fromTokenizer(tokenizer));
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
      return await new ZipHandler(tokenizer).unzip(zipHeader => {
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
          return {
            async handler(fileData) {
              const mimeType = new TextDecoder("utf-8").decode(fileData).trim();
              fileType = getFileTypeFromMimeType(mimeType);
            },
            stop: !0
          };

         case "[Content_Types].xml":
          return {
            async handler(fileData) {
              let xmlContent = new TextDecoder("utf-8").decode(fileData);
              const endPos = xmlContent.indexOf('.main+xml"');
              if (-1 === endPos) {
                const mimeType = "application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
                xmlContent.includes(`ContentType="${mimeType}"`) && (fileType = getFileTypeFromMimeType(mimeType));
              } else {
                xmlContent = xmlContent.slice(0, Math.max(0, endPos));
                const firstPos = xmlContent.lastIndexOf('"'), mimeType = xmlContent.slice(Math.max(0, firstPos + 1));
                fileType = getFileTypeFromMimeType(mimeType);
              }
            },
            stop: !0
          };

         default:
          return /classes\d*\.dex/.test(zipHeader.filename) ? (fileType = {
            ext: "apk",
            mime: "application/vnd.android.package-archive"
          }, {
            stop: !0
          }) : {};
        }
      }), fileType ?? {
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
        mime: "audio/x-flac"
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
      try {
        const skipBytes = 1350;
        if (skipBytes === await tokenizer.ignore(skipBytes)) {
          const maxBufferSize = 10485760, buffer = new Uint8Array(Math.min(maxBufferSize, tokenizer.fileInfo.size - skipBytes));
          if (await tokenizer.readBuffer(buffer, {
            mayBeLess: !0
          }), array = buffer, value = (new TextEncoder).encode("AIPrivateData"), -1 !== function(array, value) {
            const arrayLength = array.length, valueLength = value.length;
            if (0 === valueLength) {
              return -1;
            }
            if (valueLength > arrayLength) {
              return -1;
            }
            const validOffsetLength = arrayLength - valueLength;
            for (let index = 0; index <= validOffsetLength; index++) {
              let isMatch = !0;
              for (let index2 = 0; index2 < valueLength; index2++) {
                if (array[index + index2] !== value[index2]) {
                  isMatch = !1;
                  break;
                }
              }
              if (isMatch) {
                return index;
              }
            }
            return -1;
          }(array, value)) {
            return {
              ext: "ai",
              mime: "application/postscript"
            };
          }
        }
      } catch (error) {
        if (!(error instanceof EndOfStreamError)) {
          throw error;
        }
      }
      return {
        ext: "pdf",
        mime: "application/pdf"
      };
    }
    var array, value;
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
        return await tokenizer.readBuffer(id), id;
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
        for (;children > 0; ) {
          const element = await readElement();
          if (17026 === element.id) {
            return (await tokenizer.readToken(new StringType$1(element.len))).replaceAll(/\00.*$/g, "");
          }
          await tokenizer.ignore(element.len), --children;
        }
      }
      const re = await readElement();
      switch (await readChildren(re.len)) {
       case "webm":
        return {
          ext: "webm",
          mime: "video/webm"
        };

       case "matroska":
        return {
          ext: "mkv",
          mime: "video/x-matroska"
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
    if (this.checkString("PAR1")) {
      return {
        ext: "parquet",
        mime: "application/x-parquet"
      };
    }
    if (this.checkString("ttcf")) {
      return {
        ext: "ttc",
        mime: "font/collection"
      };
    }
    if (this.check([ 207, 250, 237, 254 ])) {
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
      return {
        ext: "class",
        mime: "application/java-vm"
      };
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
      const version = new StringType$1(4, "latin1").get(this.buffer, 2);
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
      return "debian-binary" === await tokenizer.readToken(new StringType$1(13, "ascii")) ? {
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
      async function readChunkHeader() {
        return {
          length: await tokenizer.readToken(INT32_BE),
          type: await tokenizer.readToken(new StringType$1(4, "latin1"))
        };
      }
      await tokenizer.ignore(8);
      do {
        const chunk = await readChunkHeader();
        if (chunk.length < 0) {
          return;
        }
        switch (chunk.type) {
         case "IDAT":
          return {
            ext: "png",
            mime: "image/png"
          };

         case "acTL":
          return {
            ext: "apng",
            mime: "image/apng"
          };

         default:
          await tokenizer.ignore(chunk.length + 4);
        }
      } while (tokenizer.position + 8 < tokenizer.fileInfo.size);
      return {
        ext: "png",
        mime: "image/png"
      };
    }
    if (this.check([ 65, 82, 82, 79, 87, 49, 0, 0 ])) {
      return {
        ext: "arrow",
        mime: "application/x-apache-arrow"
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
      const brandMajor = new StringType$1(4, "latin1").get(this.buffer, 8).replace("\0", " ").trim();
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
      async function readHeader() {
        const guid = new Uint8Array(16);
        return await tokenizer.readBuffer(guid), {
          id: guid,
          size: Number(await tokenizer.readToken(UINT64_LE))
        };
      }
      for (await tokenizer.ignore(30); tokenizer.position + 24 < tokenizer.fileInfo.size; ) {
        const header = await readHeader();
        let payload = header.size - 24;
        if (_check(header.id, [ 145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101 ])) {
          const typeId = new Uint8Array(16);
          if (payload -= await tokenizer.readBuffer(typeId), _check(typeId, [ 64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43 ])) {
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
        await tokenizer.ignore(payload);
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
      switch (await tokenizer.readToken(new StringType$1(4, "ascii"))) {
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
      return this.check([ 0, 60, 0, 63, 0, 120, 0, 109, 0, 108 ], {
        offset: 2
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
          const header = (new TextDecoder).decode(this.buffer.slice(16, jsonSize + 16));
          if (JSON.parse(header).files) {
            return {
              ext: "asar",
              mime: "application/x-asar"
            };
          }
        } catch {}
      }
    }
    return this.check([ 6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2 ]) ? {
      ext: "mxf",
      mime: "application/mxf"
    } : this.checkString("SCRM", {
      offset: 44
    }) ? {
      ext: "s3m",
      mime: "audio/x-s3m"
    } : this.check([ 71 ]) && this.check([ 71 ], {
      offset: 188
    }) || this.check([ 71 ], {
      offset: 4
    }) && this.check([ 71 ], {
      offset: 196
    }) ? {
      ext: "mts",
      mime: "video/mp2t"
    } : this.check([ 66, 79, 79, 75, 77, 79, 66, 73 ], {
      offset: 60
    }) ? {
      ext: "mobi",
      mime: "application/x-mobipocket-ebook"
    } : this.check([ 68, 73, 67, 77 ], {
      offset: 128
    }) ? {
      ext: "dcm",
      mime: "application/dicom"
    } : this.check([ 76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70 ]) ? {
      ext: "lnk",
      mime: "application/x.ms.shortcut"
    } : this.check([ 98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0 ]) ? {
      ext: "alias",
      mime: "application/x.apple.alias"
    } : this.checkString("Kaydara FBX Binary  \0") ? {
      ext: "fbx",
      mime: "application/x.autodesk.fbx"
    } : this.check([ 76, 80 ], {
      offset: 34
    }) && (this.check([ 0, 0, 1 ], {
      offset: 8
    }) || this.check([ 1, 0, 2 ], {
      offset: 8
    }) || this.check([ 2, 0, 2 ], {
      offset: 8
    })) ? {
      ext: "eot",
      mime: "application/vnd.ms-fontobject"
    } : this.check([ 6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29 ]) ? {
      ext: "indd",
      mime: "application/x-indesign"
    } : (await tokenizer.peekBuffer(this.buffer, {
      length: Math.min(512, tokenizer.fileInfo.size),
      mayBeLess: !0
    }), function(arrayBuffer, offset = 0) {
      const readSum = Number.parseInt(new StringType$1(6).get(arrayBuffer, 148).replace(/\0.*$/, "").trim(), 8);
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
    }(this.buffer) ? {
      ext: "tar",
      mime: "application/x-tar"
    } : this.check([ 255, 254 ]) ? this.check([ 60, 0, 63, 0, 120, 0, 109, 0, 108, 0 ], {
      offset: 2
    }) ? {
      ext: "xml",
      mime: "application/xml"
    } : this.check([ 255, 14, 83, 0, 107, 0, 101, 0, 116, 0, 99, 0, 104, 0, 85, 0, 112, 0, 32, 0, 77, 0, 111, 0, 100, 0, 101, 0, 108, 0 ], {
      offset: 2
    }) ? {
      ext: "skp",
      mime: "application/vnd.sketchup.skp"
    } : void 0 : this.checkString("-----BEGIN PGP MESSAGE-----") ? {
      ext: "pgp",
      mime: "application/pgp-encrypted"
    } : void 0);
  };
  detectImprecise=async tokenizer => {
    if (this.buffer = new Uint8Array(reasonableDetectionSizeInBytes), await tokenizer.peekBuffer(this.buffer, {
      length: Math.min(8, tokenizer.fileInfo.size),
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
    if (this.buffer.length >= 2 && this.check([ 255, 224 ], {
      offset: 0,
      mask: [ 255, 224 ]
    })) {
      if (this.check([ 16 ], {
        offset: 1,
        mask: [ 22 ]
      })) {
        return this.check([ 8 ], {
          offset: 1,
          mask: [ 8 ]
        }), {
          ext: "aac",
          mime: "audio/aac"
        };
      }
      if (this.check([ 2 ], {
        offset: 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      }
      if (this.check([ 4 ], {
        offset: 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      }
      if (this.check([ 6 ], {
        offset: 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp1",
          mime: "audio/mpeg"
        };
      }
    }
  };
  async readTiffTag(bigEndian) {
    const tagId = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE$1);
    switch (this.tokenizer.ignore(10), tagId) {
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
    const numberOfTags = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE$1);
    for (let n = 0; n < numberOfTags; ++n) {
      const fileType = await this.readTiffTag(bigEndian);
      if (fileType) {
        return fileType;
      }
    }
  }
  async readTiffHeader(bigEndian) {
    const version = (bigEndian ? UINT16_BE : UINT16_LE$1).get(this.buffer, 2), ifdOffset = (bigEndian ? UINT32_BE : UINT32_LE$1).get(this.buffer, 4);
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
          const someId1 = (bigEndian ? UINT16_BE : UINT16_LE$1).get(this.buffer, 8), someId2 = (bigEndian ? UINT16_BE : UINT16_LE$1).get(this.buffer, 10);
          if (28 === someId1 && 254 === someId2 || 31 === someId1 && 11 === someId2) {
            return {
              ext: "nef",
              mime: "image/x-nikon-nef"
            };
          }
        }
      }
      await this.tokenizer.ignore(ifdOffset);
      return await this.readTiffIFD(bigEndian) ?? {
        ext: "tif",
        mime: "image/tiff"
      };
    }
    if (43 === version) {
      return {
        ext: "tif",
        mime: "image/tiff"
      };
    }
  }
}

new Set([ "jpg", "png", "apng", "gif", "webp", "flif", "xcf", "cr2", "cr3", "orf", "arw", "dng", "nef", "rw2", "raf", "tif", "bmp", "icns", "jxr", "psd", "indd", "zip", "tar", "rar", "gz", "bz2", "7z", "dmg", "mp4", "mid", "mkv", "webm", "mov", "avi", "mpg", "mp2", "mp3", "m4a", "oga", "ogg", "ogv", "opus", "flac", "wav", "spx", "amr", "pdf", "epub", "elf", "macho", "exe", "swf", "rtf", "wasm", "woff", "woff2", "eot", "ttf", "otf", "ttc", "ico", "flv", "ps", "xz", "sqlite", "nes", "crx", "xpi", "cab", "deb", "ar", "rpm", "Z", "lz", "cfb", "mxf", "mts", "blend", "bpg", "docx", "pptx", "xlsx", "3gp", "3g2", "j2c", "jp2", "jpm", "jpx", "mj2", "aif", "qcp", "odt", "ods", "odp", "xml", "mobi", "heic", "cur", "ktx", "ape", "wv", "dcm", "ics", "glb", "pcap", "dsf", "lnk", "alias", "voc", "ac3", "m4v", "m4p", "m4b", "f4v", "f4p", "f4b", "f4a", "mie", "asf", "ogm", "ogx", "mpc", "arrow", "shp", "aac", "mp1", "it", "s3m", "xm", "ai", "skp", "avif", "eps", "lzh", "pgp", "asar", "stl", "chm", "3mf", "zst", "jxl", "vcf", "jls", "pst", "dwg", "parquet", "class", "arj", "cpio", "ace", "avro", "icc", "fbx", "vsdx", "vtt", "apk", "drc", "lz4", "potx", "xltx", "dotx", "xltm", "ott", "ots", "otp", "odg", "otg", "xlsm", "docm", "dotm", "potm", "pptm", "jar", "rm", "ppsm", "ppsx" ]), 
new Set([ "image/jpeg", "image/png", "image/gif", "image/webp", "image/flif", "image/x-xcf", "image/x-canon-cr2", "image/x-canon-cr3", "image/tiff", "image/bmp", "image/vnd.ms-photo", "image/vnd.adobe.photoshop", "application/x-indesign", "application/epub+zip", "application/x-xpinstall", "application/vnd.ms-powerpoint.slideshow.macroenabled.12", "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.presentation", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.slideshow", "application/zip", "application/x-tar", "application/x-rar-compressed", "application/gzip", "application/x-bzip2", "application/x-7z-compressed", "application/x-apple-diskimage", "application/x-apache-arrow", "video/mp4", "audio/midi", "video/x-matroska", "video/webm", "video/quicktime", "video/vnd.avi", "audio/wav", "audio/qcelp", "audio/x-ms-asf", "video/x-ms-asf", "application/vnd.ms-asf", "video/mpeg", "video/3gpp", "audio/mpeg", "audio/mp4", "video/ogg", "audio/ogg", "audio/ogg; codecs=opus", "application/ogg", "audio/x-flac", "audio/ape", "audio/wavpack", "audio/amr", "application/pdf", "application/x-elf", "application/x-mach-binary", "application/x-msdownload", "application/x-shockwave-flash", "application/rtf", "application/wasm", "font/woff", "font/woff2", "application/vnd.ms-fontobject", "font/ttf", "font/otf", "font/collection", "image/x-icon", "video/x-flv", "application/postscript", "application/eps", "application/x-xz", "application/x-sqlite3", "application/x-nintendo-nes-rom", "application/x-google-chrome-extension", "application/vnd.ms-cab-compressed", "application/x-deb", "application/x-unix-archive", "application/x-rpm", "application/x-compress", "application/x-lzip", "application/x-cfb", "application/x-mie", "application/mxf", "video/mp2t", "application/x-blender", "image/bpg", "image/j2c", "image/jp2", "image/jpx", "image/jpm", "image/mj2", "audio/aiff", "application/xml", "application/x-mobipocket-ebook", "image/heif", "image/heif-sequence", "image/heic", "image/heic-sequence", "image/icns", "image/ktx", "application/dicom", "audio/x-musepack", "text/calendar", "text/vcard", "text/vtt", "model/gltf-binary", "application/vnd.tcpdump.pcap", "audio/x-dsf", "application/x.ms.shortcut", "application/x.apple.alias", "audio/x-voc", "audio/vnd.dolby.dd-raw", "audio/x-m4a", "image/apng", "image/x-olympus-orf", "image/x-sony-arw", "image/x-adobe-dng", "image/x-nikon-nef", "image/x-panasonic-rw2", "image/x-fujifilm-raf", "video/x-m4v", "video/3gpp2", "application/x-esri-shape", "audio/aac", "audio/x-it", "audio/x-s3m", "audio/x-xm", "video/MP1S", "video/MP2P", "application/vnd.sketchup.skp", "image/avif", "application/x-lzh-compressed", "application/pgp-encrypted", "application/x-asar", "model/stl", "application/vnd.ms-htmlhelp", "model/3mf", "image/jxl", "application/zstd", "image/jls", "application/vnd.ms-outlook", "image/vnd.dwg", "application/x-parquet", "application/java-vm", "application/x-arj", "application/x-cpio", "application/x-ace-compressed", "application/avro", "application/vnd.iccprofile", "application/x.autodesk.fbx", "application/vnd.visio", "application/vnd.android.package-archive", "application/vnd.google.draco", "application/x-lz4", "application/vnd.openxmlformats-officedocument.presentationml.template", "application/vnd.openxmlformats-officedocument.spreadsheetml.template", "application/vnd.openxmlformats-officedocument.wordprocessingml.template", "application/vnd.ms-excel.template.macroenabled.12", "application/vnd.oasis.opendocument.text-template", "application/vnd.oasis.opendocument.spreadsheet-template", "application/vnd.oasis.opendocument.presentation-template", "application/vnd.oasis.opendocument.graphics", "application/vnd.oasis.opendocument.graphics-template", "application/vnd.ms-excel.sheet.macroenabled.12", "application/vnd.ms-word.document.macroenabled.12", "application/vnd.ms-word.template.macroenabled.12", "application/vnd.ms-powerpoint.template.macroenabled.12", "application/vnd.ms-powerpoint.presentation.macroenabled.12", "application/java-archive", "application/vnd.rn-realmedia" ]);

const imageExtensions = new Set([ "jpg", "png", "gif", "webp", "flif", "cr2", "tif", "bmp", "jxr", "psd", "ico", "bpg", "jp2", "jpm", "jpx", "heic", "cur", "dcm", "avif" ]);

async function imageType(input) {
  const result = await async function(input) {
    return (new FileTypeParser).fromBuffer(input);
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
}, fetchToArrayBuffer = async (url, maxRetries = 3) => {
  let attempt = 0;
  for (;attempt < maxRetries; ) {
    try {
      return await fetchArrayBufferOnce(url);
    } catch (err) {
      console.error(`Error fetching ${url}:`), console.error(err), console.warn(`Retrying fetchToUint8Array for ${url}, retry count: ${attempt}`);
      if (![ err instanceof TypeError && err.message.includes("Failed to fetch"), err instanceof FetchHTTPError ].some(Boolean)) {
        throw console.error(`Not retrying fetch for ${url} due to unknown error`), err;
      }
      attempt++, console.warn(`Fetch failed for ${url}, attempt ${attempt}/${maxRetries}.`), 
      await sleep(2e3);
    }
  }
  throw console.error(`Failed to fetch ${url} after ${maxRetries} attempts.`), new Error(`Failed to fetch url ${url} after ${maxRetries} attempts.`);
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
})(), convertHEIC = async ({filename: filename, data: data}) => {
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
    }), sharpBuffer = sharp(decodedData.data, {
      raw: {
        width: w,
        height: h,
        channels: 4
      }
    }), jpegData = await sharpBuffer.jpeg({
      quality: 100,
      chromaSubsampling: "4:4:4"
    }).keepMetadata().toBuffer();
    Log.debug("[MMM-OneDrive] [convertHEIC] Done", {
      duration: Date.now() - d
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
};

class FileError extends Error {
  constructor(message) {
    super(message), this.name = "FileError";
  }
}

const isJpgFn = buffer => {
  if (!buffer || buffer.byteLength < 3) {
    return !1;
  }
  const view = new Uint8Array(buffer);
  return 255 === view[0] && 216 === view[1] && 255 === view[2];
};

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
      skipWait && (console.info("[IntervalRunner]: Skip to next cycle"), skipWait());
    },
    stop: () => {
      console.info("[IntervalRunner]: Stopping"), state.stopped = !0, skipWait && skipWait();
    },
    resume: () => {
      console.info("[IntervalRunner]: To resume"), state.running || (console.info("[IntervalRunner]: Resuming"), 
      state.stopped = !1, cycle());
    },
    state: () => ({
      ...state
    })
  };
}, exports.urlToDisk = async (photo, dest) => {
  let photoArrayBuffer = await fetchToArrayBuffer(photo.baseUrl);
  const imageType$1 = await imageType(photoArrayBuffer);
  if (!imageType$1) {
    throw new FileError(`Could not determine image type for ${photo.filename}`);
  }
  if (Log.debug(`[MMM-OneDrive] [urlToImageBase64] Image type: ${imageType$1.ext}, mimeType: ${imageType$1.mime}`), 
  "heic" === imageType$1.ext) {
    photoArrayBuffer = await convertHEIC({
      filename: photo.filename,
      data: photoArrayBuffer
    });
    if (!isJpgFn(photoArrayBuffer)) {
      throw new FileError(`The output of convertHEIC is not a valid JPG:\n                ${photo.filename}, mimeType: ${photo.mimeType}, url: ${photo.baseUrl}`);
    }
  }
  await fs$1.writeFile(dest, Buffer.from(photoArrayBuffer));
}, exports.urlToImageBase64 = async photo => {
  let photoArrayBuffer = await fetchToArrayBuffer(photo.baseUrl);
  const imageType$1 = await imageType(photoArrayBuffer);
  if (!imageType$1) {
    throw new FileError(`Could not determine image type for ${photo.filename}`);
  }
  if (Log.debug(`[MMM-OneDrive] [urlToImageBase64] Image type: ${imageType$1.ext}, mimeType: ${imageType$1.mime}`), 
  "heic" === imageType$1.ext) {
    photoArrayBuffer = await convertHEIC({
      filename: photo.filename,
      data: photoArrayBuffer
    });
    if (!isJpgFn(photoArrayBuffer)) {
      throw new FileError(`The output of convertHEIC is not a valid JPG:\n                ${photo.filename}, mimeType: ${photo.mimeType}, url: ${photo.baseUrl}`);
    }
  }
  const base64 = Buffer.from(photoArrayBuffer).toString("base64");
  return photoArrayBuffer = null, base64;
};
