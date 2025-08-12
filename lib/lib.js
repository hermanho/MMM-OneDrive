/*! *****************************************************************************
  mmm-onedrive
  Version 1.5.4

  MagicMirror² module to display your photos from OneDrive.
  Please submit bugs at https://github.com/hermanho/MMM-OneDrive/issues

  (c) hermanho
  Licence: MIT

  This file is auto-generated. Do not edit.
***************************************************************************** */

"use strict";

var require$$1 = require("tty"), require$$1$1 = require("util"), require$$0 = require("os"), Log = require("logger"), JPEG = require("jpeg-js"), fs = require("fs"), libheifWASMModule = require("libheif-js/libheif-wasm/libheif.js");

function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x.default : x;
}

var ieee754 = {}, hasRequiredIeee754;

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */ function requireIeee754() {
  return hasRequiredIeee754 || (hasRequiredIeee754 = 1, ieee754.read = function(buffer, offset, isLE, mLen, nBytes) {
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
  }), ieee754;
}

function dv(array) {
  return new DataView(array.buffer, array.byteOffset);
}

requireIeee754();

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
    if (this.len = len, encoding && "windows-1252" === encoding.toLowerCase()) {
      this.decoder = StringType.decodeWindows1252;
    } else {
      const textDecoder = new TextDecoder(encoding);
      this.decoder = bytes => textDecoder.decode(bytes);
    }
  }
  get(data, offset = 0) {
    const bytes = data.subarray(offset, offset + this.len);
    return this.decoder(bytes);
  }
  static decodeWindows1252(bytes) {
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      result += byte < 128 || byte >= 160 ? String.fromCharCode(byte) : StringType.win1252Map[byte - 128];
    }
    return result;
  }
}

StringType.win1252Map = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

const defaultMessages = "End-Of-Stream";

class EndOfStreamError extends Error {
  constructor() {
    super(defaultMessages), this.name = "EndOfStreamError";
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

function makeWebStreamReader(stream) {
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
}

let AbstractTokenizer$1 = class {
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
};

const maxBufferSize = 256e3;

let ReadStreamTokenizer$1 = class extends AbstractTokenizer$1 {
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
    const bufSize = Math.min(maxBufferSize, length), buf = new Uint8Array(bufSize);
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
}, BufferTokenizer$1 = class extends AbstractTokenizer$1 {
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
};

function fromWebStream(webStream, options) {
  const webStreamReader = makeWebStreamReader(webStream), _options = options ?? {}, chainedClose = _options.onClose;
  return _options.onClose = async () => {
    if (await webStreamReader.close(), chainedClose) {
      return chainedClose();
    }
  }, new ReadStreamTokenizer$1(webStreamReader, _options);
}

function fromBuffer(uint8Array, options) {
  return new BufferTokenizer$1(uint8Array, options);
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

for (var _b = freb(fdeb, 0), fd = _b.b, rev = new u16(32768), i = 0; i < 32768; ++i) {
  var x = (43690 & i) >> 1 | (21845 & i) << 1;
  x = (52428 & x) >> 2 | (13107 & x) << 2, x = (61680 & x) >> 4 | (3855 & x) << 4, 
  rev[i] = ((65280 & x) >> 8 | (255 & x) << 8) >> 1;
}

for (var hMap = function(cd, mb, r) {
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
}, flt = new u8(288), i = 0; i < 144; ++i) {
  flt[i] = 8;
}

for (var i = 144; i < 256; ++i) {
  flt[i] = 9;
}

for (var i = 256; i < 280; ++i) {
  flt[i] = 7;
}

for (var i = 280; i < 288; ++i) {
  flt[i] = 8;
}

for (var fdt = new u8(32), i = 0; i < 32; ++i) {
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
}, slc = function(v, s, e) {
  return (null == e || e > v.length) && (e = v.length), new u8(v.subarray(s, e));
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
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
}, et = new u8(0), gzs = function(d) {
  31 == d[0] && 139 == d[1] && 8 == d[2] || err(6, "invalid gzip data");
  var flg = d[3], st = 10;
  4 & flg && (st += 2 + (d[10] | d[11] << 8));
  for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++]) {}
  return st + (2 & flg);
}, gzl = function(d) {
  var l = d.length;
  return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
}, zls = function(d, dict) {
  return (8 != (15 & d[0]) || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31) && err(6, "invalid zlib data"), 
  1 == (d[1] >> 5 & 1) && err(6, "invalid zlib data: " + (32 & d[1] ? "need" : "unexpected") + " dictionary"), 
  2 + (d[1] >> 3 & 4);
};

function inflateSync(data, opts) {
  return inflt(data, {
    i: 2
  }, opts, opts);
}

function gunzipSync(data, opts) {
  var st = gzs(data);
  return st + 8 > data.length && err(6, "invalid gzip data"), inflt(data.subarray(st, -8), {
    i: 2
  }, new u8(gzl(data)), opts);
}

function unzlibSync(data, opts) {
  return inflt(data.subarray(zls(data), -4), {
    i: 2
  }, opts, opts);
}

function decompressSync(data, opts) {
  return 31 == data[0] && 139 == data[1] && 8 == data[2] ? gunzipSync(data, opts) : 8 != (15 & data[0]) || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflateSync(data, opts) : unzlibSync(data, opts);
}

var td = "undefined" != typeof TextDecoder && new TextDecoder, tds = 0;

try {
  td.decode(et, {
    stream: !0
  }), tds = 1;
} catch (e) {}

var src = {
  exports: {}
}, browser = {
  exports: {}
}, ms, hasRequiredMs, common, hasRequiredCommon, hasRequiredBrowser;

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

function requireBrowser() {
  return hasRequiredBrowser || (hasRequiredBrowser = 1, function(module, exports) {
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
      !r && "undefined" != typeof process && "env" in process && (r = process.env.DEBUG);
      return r;
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
  }(browser, browser.exports)), browser.exports;
}

var node = {
  exports: {}
}, hasFlag, hasRequiredHasFlag, supportsColor_1, hasRequiredSupportsColor, hasRequiredNode, hasRequiredSrc;

function requireHasFlag() {
  return hasRequiredHasFlag ? hasFlag : (hasRequiredHasFlag = 1, hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : 1 === flag.length ? "-" : "--", position = argv.indexOf(prefix + flag), terminatorPosition = argv.indexOf("--");
    return -1 !== position && (-1 === terminatorPosition || position < terminatorPosition);
  });
}

function requireSupportsColor() {
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
      const supportsColor = requireSupportsColor();
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

function requireSrc() {
  return hasRequiredSrc || (hasRequiredSrc = 1, "undefined" == typeof process || "renderer" === process.type || !0 === process.browser || process.__nwjs ? src.exports = requireBrowser() : src.exports = requireNode()), 
  src.exports;
}

var srcExports = requireSrc(), initDebug = getDefaultExportFromCjs(srcExports);

const Signature = {
  LocalFileHeader: 67324752,
  DataDescriptor: 134695760,
  CentralFileHeader: 33639248,
  EndOfCentralDirectory: 101010256
}, DataDescriptor = {
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

const debug = initDebug("tokenizer:inflate"), syncBufferSize = 262144, ddSignatureArray = signatureToArray(Signature.DataDescriptor), eocdSignatureBytes = signatureToArray(Signature.EndOfCentralDirectory);

class ZipHandler {
  constructor(tokenizer) {
    this.tokenizer = tokenizer, this.syncBuffer = new Uint8Array(syncBufferSize);
  }
  async isZip() {
    return await this.peekSignature() === Signature.LocalFileHeader;
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
        if (entry.signature !== Signature.CentralFileHeader) {
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
        let len = syncBufferSize;
        debug("Compressed-file-size unknown, scanning for next data-descriptor-signature....");
        let nextHeaderIndex = -1;
        for (;nextHeaderIndex < 0 && len === syncBufferSize; ) {
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
    if (signature === Signature.LocalFileHeader) {
      const header = await this.tokenizer.readToken(LocalFileHeaderToken);
      return header.filename = await this.tokenizer.readToken(new StringType(header.filenameLength, "utf-8")), 
      header;
    }
    if (signature === Signature.CentralFileHeader) {
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

function indexOf(array, value) {
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
}

function includes(array, value) {
  return -1 !== indexOf(array, value);
}

function stringToBytes(string) {
  return [ ...string ].map(character => character.charCodeAt(0));
}

function tarHeaderChecksumMatches(arrayBuffer, offset = 0) {
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
}

new globalThis.TextDecoder("utf8"), new globalThis.TextEncoder, Array.from({
  length: 256
}, (_, index) => index.toString(16).padStart(2, "0"));

const uint32SyncSafeToken = {
  get: (buffer, offset) => 127 & buffer[offset + 3] | buffer[offset + 2] << 7 | buffer[offset + 1] << 14 | buffer[offset] << 21,
  len: 4
}, extensions = [ "jpg", "png", "apng", "gif", "webp", "flif", "xcf", "cr2", "cr3", "orf", "arw", "dng", "nef", "rw2", "raf", "tif", "bmp", "icns", "jxr", "psd", "indd", "zip", "tar", "rar", "gz", "bz2", "7z", "dmg", "mp4", "mid", "mkv", "webm", "mov", "avi", "mpg", "mp2", "mp3", "m4a", "oga", "ogg", "ogv", "opus", "flac", "wav", "spx", "amr", "pdf", "epub", "elf", "macho", "exe", "swf", "rtf", "wasm", "woff", "woff2", "eot", "ttf", "otf", "ttc", "ico", "flv", "ps", "xz", "sqlite", "nes", "crx", "xpi", "cab", "deb", "ar", "rpm", "Z", "lz", "cfb", "mxf", "mts", "blend", "bpg", "docx", "pptx", "xlsx", "3gp", "3g2", "j2c", "jp2", "jpm", "jpx", "mj2", "aif", "qcp", "odt", "ods", "odp", "xml", "mobi", "heic", "cur", "ktx", "ape", "wv", "dcm", "ics", "glb", "pcap", "dsf", "lnk", "alias", "voc", "ac3", "m4v", "m4p", "m4b", "f4v", "f4p", "f4b", "f4a", "mie", "asf", "ogm", "ogx", "mpc", "arrow", "shp", "aac", "mp1", "it", "s3m", "xm", "ai", "skp", "avif", "eps", "lzh", "pgp", "asar", "stl", "chm", "3mf", "zst", "jxl", "vcf", "jls", "pst", "dwg", "parquet", "class", "arj", "cpio", "ace", "avro", "icc", "fbx", "vsdx", "vtt", "apk", "drc", "lz4", "potx", "xltx", "dotx", "xltm", "ott", "ots", "otp", "odg", "otg", "xlsm", "docm", "dotm", "potm", "pptm", "jar", "rm", "ppsm", "ppsx" ], mimeTypes = [ "image/jpeg", "image/png", "image/gif", "image/webp", "image/flif", "image/x-xcf", "image/x-canon-cr2", "image/x-canon-cr3", "image/tiff", "image/bmp", "image/vnd.ms-photo", "image/vnd.adobe.photoshop", "application/x-indesign", "application/epub+zip", "application/x-xpinstall", "application/vnd.ms-powerpoint.slideshow.macroenabled.12", "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.presentation", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.slideshow", "application/zip", "application/x-tar", "application/x-rar-compressed", "application/gzip", "application/x-bzip2", "application/x-7z-compressed", "application/x-apple-diskimage", "application/x-apache-arrow", "video/mp4", "audio/midi", "video/x-matroska", "video/webm", "video/quicktime", "video/vnd.avi", "audio/wav", "audio/qcelp", "audio/x-ms-asf", "video/x-ms-asf", "application/vnd.ms-asf", "video/mpeg", "video/3gpp", "audio/mpeg", "audio/mp4", "video/ogg", "audio/ogg", "audio/ogg; codecs=opus", "application/ogg", "audio/x-flac", "audio/ape", "audio/wavpack", "audio/amr", "application/pdf", "application/x-elf", "application/x-mach-binary", "application/x-msdownload", "application/x-shockwave-flash", "application/rtf", "application/wasm", "font/woff", "font/woff2", "application/vnd.ms-fontobject", "font/ttf", "font/otf", "font/collection", "image/x-icon", "video/x-flv", "application/postscript", "application/eps", "application/x-xz", "application/x-sqlite3", "application/x-nintendo-nes-rom", "application/x-google-chrome-extension", "application/vnd.ms-cab-compressed", "application/x-deb", "application/x-unix-archive", "application/x-rpm", "application/x-compress", "application/x-lzip", "application/x-cfb", "application/x-mie", "application/mxf", "video/mp2t", "application/x-blender", "image/bpg", "image/j2c", "image/jp2", "image/jpx", "image/jpm", "image/mj2", "audio/aiff", "application/xml", "application/x-mobipocket-ebook", "image/heif", "image/heif-sequence", "image/heic", "image/heic-sequence", "image/icns", "image/ktx", "application/dicom", "audio/x-musepack", "text/calendar", "text/vcard", "text/vtt", "model/gltf-binary", "application/vnd.tcpdump.pcap", "audio/x-dsf", "application/x.ms.shortcut", "application/x.apple.alias", "audio/x-voc", "audio/vnd.dolby.dd-raw", "audio/x-m4a", "image/apng", "image/x-olympus-orf", "image/x-sony-arw", "image/x-adobe-dng", "image/x-nikon-nef", "image/x-panasonic-rw2", "image/x-fujifilm-raf", "video/x-m4v", "video/3gpp2", "application/x-esri-shape", "audio/aac", "audio/x-it", "audio/x-s3m", "audio/x-xm", "video/MP1S", "video/MP2P", "application/vnd.sketchup.skp", "image/avif", "application/x-lzh-compressed", "application/pgp-encrypted", "application/x-asar", "model/stl", "application/vnd.ms-htmlhelp", "model/3mf", "image/jxl", "application/zstd", "image/jls", "application/vnd.ms-outlook", "image/vnd.dwg", "application/x-parquet", "application/java-vm", "application/x-arj", "application/x-cpio", "application/x-ace-compressed", "application/avro", "application/vnd.iccprofile", "application/x.autodesk.fbx", "application/vnd.visio", "application/vnd.android.package-archive", "application/vnd.google.draco", "application/x-lz4", "application/vnd.openxmlformats-officedocument.presentationml.template", "application/vnd.openxmlformats-officedocument.spreadsheetml.template", "application/vnd.openxmlformats-officedocument.wordprocessingml.template", "application/vnd.ms-excel.template.macroenabled.12", "application/vnd.oasis.opendocument.text-template", "application/vnd.oasis.opendocument.spreadsheet-template", "application/vnd.oasis.opendocument.presentation-template", "application/vnd.oasis.opendocument.graphics", "application/vnd.oasis.opendocument.graphics-template", "application/vnd.ms-excel.sheet.macroenabled.12", "application/vnd.ms-word.document.macroenabled.12", "application/vnd.ms-word.template.macroenabled.12", "application/vnd.ms-powerpoint.template.macroenabled.12", "application/vnd.ms-powerpoint.presentation.macroenabled.12", "application/java-archive", "application/vnd.rn-realmedia" ], reasonableDetectionSizeInBytes = 4100;

async function fileTypeFromBuffer(input) {
  return (new FileTypeParser).fromBuffer(input);
}

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
    if (buffer?.length > 1) {
      return this.fromTokenizer(fromBuffer(buffer, this.tokenizerOptions));
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
    return this.check(stringToBytes(header), options);
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
          }), includes(buffer, (new TextEncoder).encode("AIPrivateData"))) {
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
            return (await tokenizer.readToken(new StringType(element.len))).replaceAll(/\00.*$/g, "");
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
      async function readChunkHeader() {
        return {
          length: await tokenizer.readToken(INT32_BE),
          type: await tokenizer.readToken(new StringType(4, "latin1"))
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
    }), tarHeaderChecksumMatches(this.buffer) ? {
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
    const tagId = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
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
    const numberOfTags = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
    for (let n = 0; n < numberOfTags; ++n) {
      const fileType = await this.readTiffTag(bigEndian);
      if (fileType) {
        return fileType;
      }
    }
  }
  async readTiffHeader(bigEndian) {
    const version = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 2), ifdOffset = (bigEndian ? UINT32_BE : UINT32_LE).get(this.buffer, 4);
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

new Set(extensions), new Set(mimeTypes);

const imageExtensions = new Set([ "jpg", "png", "gif", "webp", "flif", "cr2", "tif", "bmp", "jxr", "psd", "ico", "bpg", "jp2", "jpm", "jpx", "heic", "cur", "dcm", "avif" ]);

async function imageType(input) {
  const result = await fileTypeFromBuffer(input);
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

const fetchToArrayBufferOnce = async url => {
  const resp = await fetch(url);
  if (!resp.ok) {
    let text = "";
    try {
      text = await resp.text();
    } catch {}
    throw new FetchHTTPError(url, resp.status, text);
  }
  return await resp.arrayBuffer();
}, fetchToArrayBuffer = async (url, maxRetries = 3) => {
  let attempt = 0;
  for (;attempt < maxRetries; ) {
    try {
      return await fetchToArrayBufferOnce(url);
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
};

var util$1, objectUtil;

!function(util) {
  util.assertEqual = _ => {}, util.assertIs = function(_arg) {}, util.assertNever = function(_x) {
    throw new Error;
  }, util.arrayToEnum = items => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  }, util.getValidEnumValues = obj => {
    const validKeys = util.objectKeys(obj).filter(k => "number" != typeof obj[obj[k]]), filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util.objectValues(filtered);
  }, util.objectValues = obj => util.objectKeys(obj).map(function(e) {
    return obj[e];
  }), util.objectKeys = "function" == typeof Object.keys ? obj => Object.keys(obj) : object => {
    const keys = [];
    for (const key in object) {
      Object.prototype.hasOwnProperty.call(object, key) && keys.push(key);
    }
    return keys;
  }, util.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item)) {
        return item;
      }
    }
  }, util.isInteger = "function" == typeof Number.isInteger ? val => Number.isInteger(val) : val => "number" == typeof val && Number.isFinite(val) && Math.floor(val) === val, 
  util.joinValues = function(array, separator = " | ") {
    return array.map(val => "string" == typeof val ? `'${val}'` : val).join(separator);
  }, util.jsonStringifyReplacer = (_, value) => "bigint" == typeof value ? value.toString() : value;
}(util$1 || (util$1 = {})), function(objectUtil) {
  objectUtil.mergeShapes = (first, second) => ({
    ...first,
    ...second
  });
}(objectUtil || (objectUtil = {}));

const ZodParsedType = util$1.arrayToEnum([ "string", "nan", "number", "integer", "float", "boolean", "date", "bigint", "symbol", "function", "undefined", "null", "array", "object", "unknown", "promise", "void", "never", "map", "set" ]), getParsedType = data => {
  switch (typeof data) {
   case "undefined":
    return ZodParsedType.undefined;

   case "string":
    return ZodParsedType.string;

   case "number":
    return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;

   case "boolean":
    return ZodParsedType.boolean;

   case "function":
    return ZodParsedType.function;

   case "bigint":
    return ZodParsedType.bigint;

   case "symbol":
    return ZodParsedType.symbol;

   case "object":
    return Array.isArray(data) ? ZodParsedType.array : null === data ? ZodParsedType.null : data.then && "function" == typeof data.then && data.catch && "function" == typeof data.catch ? ZodParsedType.promise : "undefined" != typeof Map && data instanceof Map ? ZodParsedType.map : "undefined" != typeof Set && data instanceof Set ? ZodParsedType.set : "undefined" != typeof Date && data instanceof Date ? ZodParsedType.date : ZodParsedType.object;

   default:
    return ZodParsedType.unknown;
  }
}, ZodIssueCode = util$1.arrayToEnum([ "invalid_type", "invalid_literal", "custom", "invalid_union", "invalid_union_discriminator", "invalid_enum_value", "unrecognized_keys", "invalid_arguments", "invalid_return_type", "invalid_date", "invalid_string", "too_small", "too_big", "invalid_intersection_types", "not_multiple_of", "not_finite" ]);

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super(), this.issues = [], this.addIssue = sub => {
      this.issues = [ ...this.issues, sub ];
    }, this.addIssues = (subs = []) => {
      this.issues = [ ...this.issues, ...subs ];
    };
    const actualProto = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, actualProto) : this.__proto__ = actualProto, 
    this.name = "ZodError", this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    }, fieldErrors = {
      _errors: []
    }, processError = error => {
      for (const issue of error.issues) {
        if ("invalid_union" === issue.code) {
          issue.unionErrors.map(processError);
        } else if ("invalid_return_type" === issue.code) {
          processError(issue.returnTypeError);
        } else if ("invalid_arguments" === issue.code) {
          processError(issue.argumentsError);
        } else if (0 === issue.path.length) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors, i = 0;
          for (;i < issue.path.length; ) {
            const el = issue.path[i];
            i === issue.path.length - 1 ? (curr[el] = curr[el] || {
              _errors: []
            }, curr[el]._errors.push(mapper(issue))) : curr[el] = curr[el] || {
              _errors: []
            }, curr = curr[el], i++;
          }
        }
      }
    };
    return processError(this), fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util$1.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return 0 === this.issues.length;
  }
  flatten(mapper = issue => issue.message) {
    const fieldErrors = {}, formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [], fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return {
      formErrors: formErrors,
      fieldErrors: fieldErrors
    };
  }
  get formErrors() {
    return this.flatten();
  }
}

ZodError.create = issues => new ZodError(issues);

const errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
   case ZodIssueCode.invalid_type:
    message = issue.received === ZodParsedType.undefined ? "Required" : `Expected ${issue.expected}, received ${issue.received}`;
    break;

   case ZodIssueCode.invalid_literal:
    message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util$1.jsonStringifyReplacer)}`;
    break;

   case ZodIssueCode.unrecognized_keys:
    message = `Unrecognized key(s) in object: ${util$1.joinValues(issue.keys, ", ")}`;
    break;

   case ZodIssueCode.invalid_union:
    message = "Invalid input";
    break;

   case ZodIssueCode.invalid_union_discriminator:
    message = `Invalid discriminator value. Expected ${util$1.joinValues(issue.options)}`;
    break;

   case ZodIssueCode.invalid_enum_value:
    message = `Invalid enum value. Expected ${util$1.joinValues(issue.options)}, received '${issue.received}'`;
    break;

   case ZodIssueCode.invalid_arguments:
    message = "Invalid function arguments";
    break;

   case ZodIssueCode.invalid_return_type:
    message = "Invalid function return type";
    break;

   case ZodIssueCode.invalid_date:
    message = "Invalid date";
    break;

   case ZodIssueCode.invalid_string:
    "object" == typeof issue.validation ? "includes" in issue.validation ? (message = `Invalid input: must include "${issue.validation.includes}"`, 
    "number" == typeof issue.validation.position && (message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`)) : "startsWith" in issue.validation ? message = `Invalid input: must start with "${issue.validation.startsWith}"` : "endsWith" in issue.validation ? message = `Invalid input: must end with "${issue.validation.endsWith}"` : util$1.assertNever(issue.validation) : message = "regex" !== issue.validation ? `Invalid ${issue.validation}` : "Invalid";
    break;

   case ZodIssueCode.too_small:
    message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "more than"} ${issue.minimum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "over"} ${issue.minimum} character(s)` : "number" === issue.type || "bigint" === issue.type ? `Number must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${issue.minimum}` : "date" === issue.type ? `Date must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(issue.minimum))}` : "Invalid input";
    break;

   case ZodIssueCode.too_big:
    message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "less than"} ${issue.maximum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "under"} ${issue.maximum} character(s)` : "number" === issue.type ? `Number must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : "bigint" === issue.type ? `BigInt must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : "date" === issue.type ? `Date must be ${issue.exact ? "exactly" : issue.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(issue.maximum))}` : "Invalid input";
    break;

   case ZodIssueCode.custom:
    message = "Invalid input";
    break;

   case ZodIssueCode.invalid_intersection_types:
    message = "Intersection results could not be merged";
    break;

   case ZodIssueCode.not_multiple_of:
    message = `Number must be a multiple of ${issue.multipleOf}`;
    break;

   case ZodIssueCode.not_finite:
    message = "Number must be finite";
    break;

   default:
    message = _ctx.defaultError, util$1.assertNever(issue);
  }
  return {
    message: message
  };
};

let overrideErrorMap = errorMap;

function getErrorMap() {
  return overrideErrorMap;
}

const makeIssue = params => {
  const {data: data, path: path, errorMaps: errorMaps, issueData: issueData} = params, fullPath = [ ...path, ...issueData.path || [] ], fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (void 0 !== issueData.message) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter(m => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, {
      data: data,
      defaultError: errorMessage
    }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};

function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap(), issue = makeIssue({
    issueData: issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, overrideMap, overrideMap === errorMap ? void 0 : errorMap ].filter(x => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    "valid" === this.value && (this.value = "dirty");
  }
  abort() {
    "aborted" !== this.value && (this.value = "aborted");
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if ("aborted" === s.status) {
        return INVALID;
      }
      "dirty" === s.status && status.dirty(), arrayValue.push(s.value);
    }
    return {
      status: status.value,
      value: arrayValue
    };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key, value = await pair.value;
      syncPairs.push({
        key: key,
        value: value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const {key: key, value: value} = pair;
      if ("aborted" === key.status) {
        return INVALID;
      }
      if ("aborted" === value.status) {
        return INVALID;
      }
      "dirty" === key.status && status.dirty(), "dirty" === value.status && status.dirty(), 
      "__proto__" === key.value || void 0 === value.value && !pair.alwaysSet || (finalObject[key.value] = value.value);
    }
    return {
      status: status.value,
      value: finalObject
    };
  }
}

const INVALID = Object.freeze({
  status: "aborted"
}), DIRTY = value => ({
  status: "dirty",
  value: value
}), OK = value => ({
  status: "valid",
  value: value
}), isAborted = x => "aborted" === x.status, isDirty = x => "dirty" === x.status, isValid = x => "valid" === x.status, isAsync = x => "undefined" != typeof Promise && x instanceof Promise;

var errorUtil;

!function(errorUtil) {
  errorUtil.errToObj = message => "string" == typeof message ? {
    message: message
  } : message || {}, errorUtil.toString = message => "string" == typeof message ? message : message?.message;
}(errorUtil || (errorUtil = {}));

class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [], this.parent = parent, this.data = value, this._path = path, 
    this._key = key;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), 
    this._cachedPath;
  }
}

const handleResult = (ctx, result) => {
  if (isValid(result)) {
    return {
      success: !0,
      data: result.value
    };
  }
  if (!ctx.common.issues.length) {
    throw new Error("Validation failed but no issues detected.");
  }
  return {
    success: !1,
    get error() {
      if (this._error) {
        return this._error;
      }
      const error = new ZodError(ctx.common.issues);
      return this._error = error, this._error;
    }
  };
};

function processCreateParams(params) {
  if (!params) {
    return {};
  }
  const {errorMap: errorMap, invalid_type_error: invalid_type_error, required_error: required_error, description: description} = params;
  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error('Can\'t use "invalid_type_error" or "required_error" in conjunction with custom error map.');
  }
  if (errorMap) {
    return {
      errorMap: errorMap,
      description: description
    };
  }
  return {
    errorMap: (iss, ctx) => {
      const {message: message} = params;
      return "invalid_enum_value" === iss.code ? {
        message: message ?? ctx.defaultError
      } : void 0 === ctx.data ? {
        message: message ?? required_error ?? ctx.defaultError
      } : "invalid_type" !== iss.code ? {
        message: ctx.defaultError
      } : {
        message: message ?? invalid_type_error ?? ctx.defaultError
      };
    },
    description: description
  };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success) {
      return result.data;
    }
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? !1,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: data,
      parsedType: getParsedType(data)
    }, result = this._parseSync({
      data: data,
      path: ctx.path,
      parent: ctx
    });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({
          data: data,
          path: [],
          parent: ctx
        });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        err?.message?.toLowerCase()?.includes("encountered") && (this["~standard"].async = !0), 
        ctx.common = {
          issues: [],
          async: !0
        };
      }
    }
    return this._parseAsync({
      data: data,
      path: [],
      parent: ctx
    }).then(result => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success) {
      return result.data;
    }
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: !0
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: data,
      parsedType: getParsedType(data)
    }, maybeAsyncResult = this._parse({
      data: data,
      path: ctx.path,
      parent: ctx
    }), result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = val => "string" == typeof message || void 0 === message ? {
      message: message
    } : "function" == typeof message ? message(val) : message;
    return this._refinement((val, ctx) => {
      const result = check(val), setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      return "undefined" != typeof Promise && result instanceof Promise ? result.then(data => !!data || (setError(), 
      !1)) : !!result || (setError(), !1);
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => !!check(val) || (ctx.addIssue("function" == typeof refinementData ? refinementData(val, ctx) : refinementData), 
    !1));
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: {
        type: "refinement",
        refinement: refinement
      }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync, this._def = def, this.parse = this.parse.bind(this), 
    this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), 
    this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), 
    this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), 
    this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), 
    this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), 
    this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), 
    this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), 
    this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), 
    this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), 
    this.isOptional = this.isOptional.bind(this), this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: data => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([ this, option ], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: {
        type: "transform",
        transform: transform
      }
    });
  }
  default(def) {
    const defaultValueFunc = "function" == typeof def ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = "function" == typeof def ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    return new (0, this.constructor)({
      ...this._def,
      description: description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}

const cuidRegex = /^c[^\s-]{8,}$/i, cuid2Regex = /^[0-9a-z]+$/, ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i, uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, nanoidRegex = /^[a-z0-9_-]{21}$/i, jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, _emojiRegex = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";

let emojiRegex;

const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, dateRegexSource = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", dateRegex = new RegExp(`^${dateRegexSource}$`);

function timeRegexSource(args) {
  let secondsRegexSource = "[0-5]\\d";
  args.precision ? secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}` : null == args.precision && (secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`);
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${args.precision ? "+" : "?"}`;
}

function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}

function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  return opts.push(args.local ? "Z?" : "Z"), args.offset && opts.push("([+-]\\d{2}:?\\d{2})"), 
  regex = `${regex}(${opts.join("|")})`, new RegExp(`^${regex}$`);
}

function isValidIP(ip, version) {
  return !("v4" !== version && version || !ipv4Regex.test(ip)) || !("v6" !== version && version || !ipv6Regex.test(ip));
}

function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt)) {
    return !1;
  }
  try {
    const [header] = jwt.split(".");
    if (!header) {
      return !1;
    }
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "="), decoded = JSON.parse(atob(base64));
    return "object" == typeof decoded && null !== decoded && ((!("typ" in decoded) || "JWT" === decoded?.typ) && (!!decoded.alg && (!alg || decoded.alg === alg)));
  } catch {
    return !1;
  }
}

function isValidCidr(ip, version) {
  return !("v4" !== version && version || !ipv4CidrRegex.test(ip)) || !("v6" !== version && version || !ipv6CidrRegex.test(ip));
}

class ZodString extends ZodType {
  _parse(input) {
    this._def.coerce && (input.data = String(input.data));
    if (this._getType(input) !== ZodParsedType.string) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx.parsedType
      }), INVALID;
    }
    const status = new ParseStatus;
    let ctx;
    for (const check of this._def.checks) {
      if ("min" === check.kind) {
        input.data.length < check.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check.message
        }), status.dirty());
      } else if ("max" === check.kind) {
        input.data.length > check.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check.message
        }), status.dirty());
      } else if ("length" === check.kind) {
        const tooBig = input.data.length > check.value, tooSmall = input.data.length < check.value;
        (tooBig || tooSmall) && (ctx = this._getOrReturnCtx(input, ctx), tooBig ? addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check.message
        }) : tooSmall && addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check.message
        }), status.dirty());
      } else if ("email" === check.kind) {
        emailRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "email",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("emoji" === check.kind) {
        emojiRegex || (emojiRegex = new RegExp(_emojiRegex, "u")), emojiRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "emoji",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("uuid" === check.kind) {
        uuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "uuid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("nanoid" === check.kind) {
        nanoidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "nanoid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("cuid" === check.kind) {
        cuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "cuid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("cuid2" === check.kind) {
        cuid2Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "cuid2",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("ulid" === check.kind) {
        ulidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "ulid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("url" === check.kind) {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          }), status.dirty();
        }
      } else if ("regex" === check.kind) {
        check.regex.lastIndex = 0;
        check.regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "regex",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("trim" === check.kind) {
        input.data = input.data.trim();
      } else if ("includes" === check.kind) {
        input.data.includes(check.value, check.position) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: {
            includes: check.value,
            position: check.position
          },
          message: check.message
        }), status.dirty());
      } else if ("toLowerCase" === check.kind) {
        input.data = input.data.toLowerCase();
      } else if ("toUpperCase" === check.kind) {
        input.data = input.data.toUpperCase();
      } else if ("startsWith" === check.kind) {
        input.data.startsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: {
            startsWith: check.value
          },
          message: check.message
        }), status.dirty());
      } else if ("endsWith" === check.kind) {
        input.data.endsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: {
            endsWith: check.value
          },
          message: check.message
        }), status.dirty());
      } else if ("datetime" === check.kind) {
        datetimeRegex(check).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: "datetime",
          message: check.message
        }), status.dirty());
      } else if ("date" === check.kind) {
        dateRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: "date",
          message: check.message
        }), status.dirty());
      } else if ("time" === check.kind) {
        timeRegex(check).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: "time",
          message: check.message
        }), status.dirty());
      } else {
        "duration" === check.kind ? durationRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "duration",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : "ip" === check.kind ? isValidIP(input.data, check.version) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "ip",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : "jwt" === check.kind ? isValidJWT(input.data, check.alg) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "jwt",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : "cidr" === check.kind ? isValidCidr(input.data, check.version) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "cidr",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : "base64" === check.kind ? base64Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "base64",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : "base64url" === check.kind ? base64urlRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          validation: "base64url",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty()) : util$1.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: input.data
    };
  }
  _regex(regex, validation, message) {
    return this.refinement(data => regex.test(data), {
      validation: validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [ ...this._def.checks, check ]
    });
  }
  email(message) {
    return this._addCheck({
      kind: "email",
      ...errorUtil.errToObj(message)
    });
  }
  url(message) {
    return this._addCheck({
      kind: "url",
      ...errorUtil.errToObj(message)
    });
  }
  emoji(message) {
    return this._addCheck({
      kind: "emoji",
      ...errorUtil.errToObj(message)
    });
  }
  uuid(message) {
    return this._addCheck({
      kind: "uuid",
      ...errorUtil.errToObj(message)
    });
  }
  nanoid(message) {
    return this._addCheck({
      kind: "nanoid",
      ...errorUtil.errToObj(message)
    });
  }
  cuid(message) {
    return this._addCheck({
      kind: "cuid",
      ...errorUtil.errToObj(message)
    });
  }
  cuid2(message) {
    return this._addCheck({
      kind: "cuid2",
      ...errorUtil.errToObj(message)
    });
  }
  ulid(message) {
    return this._addCheck({
      kind: "ulid",
      ...errorUtil.errToObj(message)
    });
  }
  base64(message) {
    return this._addCheck({
      kind: "base64",
      ...errorUtil.errToObj(message)
    });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({
      kind: "jwt",
      ...errorUtil.errToObj(options)
    });
  }
  ip(options) {
    return this._addCheck({
      kind: "ip",
      ...errorUtil.errToObj(options)
    });
  }
  cidr(options) {
    return this._addCheck({
      kind: "cidr",
      ...errorUtil.errToObj(options)
    });
  }
  datetime(options) {
    return "string" == typeof options ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: !1,
      local: !1,
      message: options
    }) : this._addCheck({
      kind: "datetime",
      precision: void 0 === options?.precision ? null : options?.precision,
      offset: options?.offset ?? !1,
      local: options?.local ?? !1,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({
      kind: "date",
      message: message
    });
  }
  time(options) {
    return "string" == typeof options ? this._addCheck({
      kind: "time",
      precision: null,
      message: options
    }) : this._addCheck({
      kind: "time",
      precision: void 0 === options?.precision ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({
      kind: "duration",
      ...errorUtil.errToObj(message)
    });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex: regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value: value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value: value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value: value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [ ...this._def.checks, {
        kind: "trim"
      } ]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [ ...this._def.checks, {
        kind: "toLowerCase"
      } ]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [ ...this._def.checks, {
        kind: "toUpperCase"
      } ]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find(ch => "datetime" === ch.kind);
  }
  get isDate() {
    return !!this._def.checks.find(ch => "date" === ch.kind);
  }
  get isTime() {
    return !!this._def.checks.find(ch => "time" === ch.kind);
  }
  get isDuration() {
    return !!this._def.checks.find(ch => "duration" === ch.kind);
  }
  get isEmail() {
    return !!this._def.checks.find(ch => "email" === ch.kind);
  }
  get isURL() {
    return !!this._def.checks.find(ch => "url" === ch.kind);
  }
  get isEmoji() {
    return !!this._def.checks.find(ch => "emoji" === ch.kind);
  }
  get isUUID() {
    return !!this._def.checks.find(ch => "uuid" === ch.kind);
  }
  get isNANOID() {
    return !!this._def.checks.find(ch => "nanoid" === ch.kind);
  }
  get isCUID() {
    return !!this._def.checks.find(ch => "cuid" === ch.kind);
  }
  get isCUID2() {
    return !!this._def.checks.find(ch => "cuid2" === ch.kind);
  }
  get isULID() {
    return !!this._def.checks.find(ch => "ulid" === ch.kind);
  }
  get isIP() {
    return !!this._def.checks.find(ch => "ip" === ch.kind);
  }
  get isCIDR() {
    return !!this._def.checks.find(ch => "cidr" === ch.kind);
  }
  get isBase64() {
    return !!this._def.checks.find(ch => "base64" === ch.kind);
  }
  get isBase64url() {
    return !!this._def.checks.find(ch => "base64url" === ch.kind);
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
    }
    return max;
  }
}

function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length, stepDecCount = (step.toString().split(".")[1] || "").length, decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}

ZodString.create = params => new ZodString({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodString,
  coerce: params?.coerce ?? !1,
  ...processCreateParams(params)
});

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(input) {
    this._def.coerce && (input.data = Number(input.data));
    if (this._getType(input) !== ZodParsedType.number) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx.parsedType
      }), INVALID;
    }
    let ctx;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if ("int" === check.kind) {
        util$1.isInteger(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: "integer",
          received: "float",
          message: check.message
        }), status.dirty());
      } else if ("min" === check.kind) {
        (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "number",
          inclusive: check.inclusive,
          exact: !1,
          message: check.message
        }), status.dirty());
      } else if ("max" === check.kind) {
        (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "number",
          inclusive: check.inclusive,
          exact: !1,
          message: check.message
        }), status.dirty());
      } else {
        "multipleOf" === check.kind ? 0 !== floatSafeRemainder(input.data, check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.not_multiple_of,
          multipleOf: check.value,
          message: check.message
        }), status.dirty()) : "finite" === check.kind ? Number.isFinite(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.not_finite,
          message: check.message
        }), status.dirty()) : util$1.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: input.data
    };
  }
  gte(value, message) {
    return this.setLimit("min", value, !0, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, !1, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, !0, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, !1, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [ ...this._def.checks, {
        kind: kind,
        value: value,
        inclusive: inclusive,
        message: errorUtil.toString(message)
      } ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [ ...this._def.checks, check ]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value: value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find(ch => "int" === ch.kind || "multipleOf" === ch.kind && util$1.isInteger(ch.value));
  }
  get isFinite() {
    let max = null, min = null;
    for (const ch of this._def.checks) {
      if ("finite" === ch.kind || "int" === ch.kind || "multipleOf" === ch.kind) {
        return !0;
      }
      "min" === ch.kind ? (null === min || ch.value > min) && (min = ch.value) : "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}

ZodNumber.create = params => new ZodNumber({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodNumber,
  coerce: params?.coerce || !1,
  ...processCreateParams(params)
});

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    if (this._getType(input) !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if ("min" === check.kind) {
        (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          type: "bigint",
          minimum: check.value,
          inclusive: check.inclusive,
          message: check.message
        }), status.dirty());
      } else if ("max" === check.kind) {
        (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          type: "bigint",
          maximum: check.value,
          inclusive: check.inclusive,
          message: check.message
        }), status.dirty());
      } else {
        "multipleOf" === check.kind ? input.data % check.value !== BigInt(0) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.not_multiple_of,
          multipleOf: check.value,
          message: check.message
        }), status.dirty()) : util$1.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: input.data
    };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    return addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    }), INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, !0, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, !1, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, !0, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, !1, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [ ...this._def.checks, {
        kind: kind,
        value: value,
        inclusive: inclusive,
        message: errorUtil.toString(message)
      } ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [ ...this._def.checks, check ]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value: value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
    }
    return max;
  }
}

ZodBigInt.create = params => new ZodBigInt({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodBigInt,
  coerce: params?.coerce ?? !1,
  ...processCreateParams(params)
});

class ZodBoolean extends ZodType {
  _parse(input) {
    this._def.coerce && (input.data = Boolean(input.data));
    if (this._getType(input) !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
}

ZodBoolean.create = params => new ZodBoolean({
  typeName: ZodFirstPartyTypeKind.ZodBoolean,
  coerce: params?.coerce || !1,
  ...processCreateParams(params)
});

class ZodDate extends ZodType {
  _parse(input) {
    this._def.coerce && (input.data = new Date(input.data));
    if (this._getType(input) !== ZodParsedType.date) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx.parsedType
      }), INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      return addIssueToContext(this._getOrReturnCtx(input), {
        code: ZodIssueCode.invalid_date
      }), INVALID;
    }
    const status = new ParseStatus;
    let ctx;
    for (const check of this._def.checks) {
      "min" === check.kind ? input.data.getTime() < check.value && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        message: check.message,
        inclusive: !0,
        exact: !1,
        minimum: check.value,
        type: "date"
      }), status.dirty()) : "max" === check.kind ? input.data.getTime() > check.value && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        message: check.message,
        inclusive: !0,
        exact: !1,
        maximum: check.value,
        type: "date"
      }), status.dirty()) : util$1.assertNever(check);
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [ ...this._def.checks, check ]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
    }
    return null != min ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
    }
    return null != max ? new Date(max) : null;
  }
}

ZodDate.create = params => new ZodDate({
  checks: [],
  coerce: params?.coerce || !1,
  typeName: ZodFirstPartyTypeKind.ZodDate,
  ...processCreateParams(params)
});

class ZodSymbol extends ZodType {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
}

ZodSymbol.create = params => new ZodSymbol({
  typeName: ZodFirstPartyTypeKind.ZodSymbol,
  ...processCreateParams(params)
});

class ZodUndefined extends ZodType {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
}

ZodUndefined.create = params => new ZodUndefined({
  typeName: ZodFirstPartyTypeKind.ZodUndefined,
  ...processCreateParams(params)
});

class ZodNull extends ZodType {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
}

ZodNull.create = params => new ZodNull({
  typeName: ZodFirstPartyTypeKind.ZodNull,
  ...processCreateParams(params)
});

class ZodAny extends ZodType {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(input) {
    return OK(input.data);
  }
}

ZodAny.create = params => new ZodAny({
  typeName: ZodFirstPartyTypeKind.ZodAny,
  ...processCreateParams(params)
});

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(input) {
    return OK(input.data);
  }
}

ZodUnknown.create = params => new ZodUnknown({
  typeName: ZodFirstPartyTypeKind.ZodUnknown,
  ...processCreateParams(params)
});

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    return addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    }), INVALID;
  }
}

ZodNever.create = params => new ZodNever({
  typeName: ZodFirstPartyTypeKind.ZodNever,
  ...processCreateParams(params)
});

class ZodVoid extends ZodType {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
}

ZodVoid.create = params => new ZodVoid({
  typeName: ZodFirstPartyTypeKind.ZodVoid,
  ...processCreateParams(params)
});

class ZodArray extends ZodType {
  _parse(input) {
    const {ctx: ctx, status: status} = this._processInputParams(input), def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      }), INVALID;
    }
    if (null !== def.exactLength) {
      const tooBig = ctx.data.length > def.exactLength.value, tooSmall = ctx.data.length < def.exactLength.value;
      (tooBig || tooSmall) && (addIssueToContext(ctx, {
        code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
        minimum: tooSmall ? def.exactLength.value : void 0,
        maximum: tooBig ? def.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: def.exactLength.message
      }), status.dirty());
    }
    if (null !== def.minLength && ctx.data.length < def.minLength.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_small,
      minimum: def.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: def.minLength.message
    }), status.dirty()), null !== def.maxLength && ctx.data.length > def.maxLength.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_big,
      maximum: def.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: def.maxLength.message
    }), status.dirty()), ctx.common.async) {
      return Promise.all([ ...ctx.data ].map((item, i) => def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i)))).then(result => ParseStatus.mergeArray(status, result));
    }
    const result = [ ...ctx.data ].map((item, i) => def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: {
        value: minLength,
        message: errorUtil.toString(message)
      }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: {
        value: maxLength,
        message: errorUtil.toString(message)
      }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: {
        value: len,
        message: errorUtil.toString(message)
      }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}

function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  }
  return schema instanceof ZodArray ? new ZodArray({
    ...schema._def,
    type: deepPartialify(schema.element)
  }) : schema instanceof ZodOptional ? ZodOptional.create(deepPartialify(schema.unwrap())) : schema instanceof ZodNullable ? ZodNullable.create(deepPartialify(schema.unwrap())) : schema instanceof ZodTuple ? ZodTuple.create(schema.items.map(item => deepPartialify(item))) : schema;
}

ZodArray.create = (schema, params) => new ZodArray({
  type: schema,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: ZodFirstPartyTypeKind.ZodArray,
  ...processCreateParams(params)
});

class ZodObject extends ZodType {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (null !== this._cached) {
      return this._cached;
    }
    const shape = this._def.shape(), keys = util$1.objectKeys(shape);
    return this._cached = {
      shape: shape,
      keys: keys
    }, this._cached;
  }
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.object) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      }), INVALID;
    }
    const {status: status, ctx: ctx} = this._processInputParams(input), {shape: shape, keys: shapeKeys} = this._getCached(), extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && "strip" === this._def.unknownKeys)) {
      for (const key in ctx.data) {
        shapeKeys.includes(key) || extraKeys.push(key);
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key], value = ctx.data[key];
      pairs.push({
        key: {
          status: "valid",
          value: key
        },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if ("passthrough" === unknownKeys) {
        for (const key of extraKeys) {
          pairs.push({
            key: {
              status: "valid",
              value: key
            },
            value: {
              status: "valid",
              value: ctx.data[key]
            }
          });
        }
      } else if ("strict" === unknownKeys) {
        extraKeys.length > 0 && (addIssueToContext(ctx, {
          code: ZodIssueCode.unrecognized_keys,
          keys: extraKeys
        }), status.dirty());
      } else if ("strip" !== unknownKeys) {
        throw new Error("Internal ZodObject error: invalid unknownKeys value.");
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: {
            status: "valid",
            value: key
          },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    return ctx.common.async ? Promise.resolve().then(async () => {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key, value = await pair.value;
        syncPairs.push({
          key: key,
          value: value,
          alwaysSet: pair.alwaysSet
        });
      }
      return syncPairs;
    }).then(syncPairs => ParseStatus.mergeObjectSync(status, syncPairs)) : ParseStatus.mergeObjectSync(status, pairs);
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    return errorUtil.errToObj, new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...void 0 !== message ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          return "unrecognized_keys" === issue.code ? {
            message: errorUtil.errToObj(message).message ?? defaultError
          } : {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    return new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
  }
  setKey(key, schema) {
    return this.augment({
      [key]: schema
    });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util$1.objectKeys(mask)) {
      mask[key] && this.shape[key] && (shape[key] = this.shape[key]);
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util$1.objectKeys(this.shape)) {
      mask[key] || (shape[key] = this.shape[key]);
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util$1.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      mask && !mask[key] ? newShape[key] = fieldSchema : newShape[key] = fieldSchema.optional();
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util$1.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        let newField = this.shape[key];
        for (;newField instanceof ZodOptional; ) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util$1.objectKeys(this.shape));
  }
}

ZodObject.create = (shape, params) => new ZodObject({
  shape: () => shape,
  unknownKeys: "strip",
  catchall: ZodNever.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
}), ZodObject.strictCreate = (shape, params) => new ZodObject({
  shape: () => shape,
  unknownKeys: "strict",
  catchall: ZodNever.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
}), ZodObject.lazycreate = (shape, params) => new ZodObject({
  shape: shape,
  unknownKeys: "strip",
  catchall: ZodNever.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
});

class ZodUnion extends ZodType {
  _parse(input) {
    const {ctx: ctx} = this._processInputParams(input), options = this._def.options;
    if (ctx.common.async) {
      return Promise.all(options.map(async option => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(function(results) {
        for (const result of results) {
          if ("valid" === result.result.status) {
            return result.result;
          }
        }
        for (const result of results) {
          if ("dirty" === result.result.status) {
            return ctx.common.issues.push(...result.ctx.common.issues), result.result;
          }
        }
        const unionErrors = results.map(result => new ZodError(result.ctx.common.issues));
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors: unionErrors
        }), INVALID;
      });
    }
    {
      let dirty;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        }, result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if ("valid" === result.status) {
          return result;
        }
        "dirty" !== result.status || dirty || (dirty = {
          result: result,
          ctx: childCtx
        }), childCtx.common.issues.length && issues.push(childCtx.common.issues);
      }
      if (dirty) {
        return ctx.common.issues.push(...dirty.ctx.common.issues), dirty.result;
      }
      const unionErrors = issues.map(issues => new ZodError(issues));
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors: unionErrors
      }), INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}

function mergeValues(a, b) {
  const aType = getParsedType(a), bType = getParsedType(b);
  if (a === b) {
    return {
      valid: !0,
      data: a
    };
  }
  if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util$1.objectKeys(b), sharedKeys = util$1.objectKeys(a).filter(key => -1 !== bKeys.indexOf(key)), newObj = {
      ...a,
      ...b
    };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: !1
        };
      }
      newObj[key] = sharedValue.data;
    }
    return {
      valid: !0,
      data: newObj
    };
  }
  if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return {
        valid: !1
      };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const sharedValue = mergeValues(a[index], b[index]);
      if (!sharedValue.valid) {
        return {
          valid: !1
        };
      }
      newArray.push(sharedValue.data);
    }
    return {
      valid: !0,
      data: newArray
    };
  }
  return aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b ? {
    valid: !0,
    data: a
  } : {
    valid: !1
  };
}

ZodUnion.create = (types, params) => new ZodUnion({
  options: types,
  typeName: ZodFirstPartyTypeKind.ZodUnion,
  ...processCreateParams(params)
});

class ZodIntersection extends ZodType {
  _parse(input) {
    const {status: status, ctx: ctx} = this._processInputParams(input), handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      return merged.valid ? ((isDirty(parsedLeft) || isDirty(parsedRight)) && status.dirty(), 
      {
        status: status.value,
        value: merged.data
      }) : (addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_intersection_types
      }), INVALID);
    };
    return ctx.common.async ? Promise.all([ this._def.left._parseAsync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }), this._def.right._parseAsync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }) ]).then(([left, right]) => handleParsed(left, right)) : handleParsed(this._def.left._parseSync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }), this._def.right._parseSync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }));
  }
}

ZodIntersection.create = (left, right, params) => new ZodIntersection({
  left: left,
  right: right,
  typeName: ZodFirstPartyTypeKind.ZodIntersection,
  ...processCreateParams(params)
});

class ZodTuple extends ZodType {
  _parse(input) {
    const {status: status, ctx: ctx} = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      }), INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      return addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), INVALID;
    }
    !this._def.rest && ctx.data.length > this._def.items.length && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), status.dirty());
    const items = [ ...ctx.data ].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      return schema ? schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex)) : null;
    }).filter(x => !!x);
    return ctx.common.async ? Promise.all(items).then(results => ParseStatus.mergeArray(status, results)) : ParseStatus.mergeArray(status, items);
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest: rest
    });
  }
}

ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const {status: status, ctx: ctx} = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      }), INVALID;
    }
    const keyType = this._def.keyType, valueType = this._def.valueType, pairs = [ ...ctx.data.entries() ].map(([key, value], index) => ({
      key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [ index, "key" ])),
      value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [ index, "value" ]))
    }));
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key, value = await pair.value;
          if ("aborted" === key.status || "aborted" === value.status) {
            return INVALID;
          }
          "dirty" !== key.status && "dirty" !== value.status || status.dirty(), finalMap.set(key.value, value.value);
        }
        return {
          status: status.value,
          value: finalMap
        };
      });
    }
    {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key, value = pair.value;
        if ("aborted" === key.status || "aborted" === value.status) {
          return INVALID;
        }
        "dirty" !== key.status && "dirty" !== value.status || status.dirty(), finalMap.set(key.value, value.value);
      }
      return {
        status: status.value,
        value: finalMap
      };
    }
  }
}

ZodMap.create = (keyType, valueType, params) => new ZodMap({
  valueType: valueType,
  keyType: keyType,
  typeName: ZodFirstPartyTypeKind.ZodMap,
  ...processCreateParams(params)
});

class ZodSet extends ZodType {
  _parse(input) {
    const {status: status, ctx: ctx} = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      }), INVALID;
    }
    const def = this._def;
    null !== def.minSize && ctx.data.size < def.minSize.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_small,
      minimum: def.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: def.minSize.message
    }), status.dirty()), null !== def.maxSize && ctx.data.size > def.maxSize.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_big,
      maximum: def.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: def.maxSize.message
    }), status.dirty());
    const valueType = this._def.valueType;
    function finalizeSet(elements) {
      const parsedSet = new Set;
      for (const element of elements) {
        if ("aborted" === element.status) {
          return INVALID;
        }
        "dirty" === element.status && status.dirty(), parsedSet.add(element.value);
      }
      return {
        status: status.value,
        value: parsedSet
      };
    }
    const elements = [ ...ctx.data.values() ].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    return ctx.common.async ? Promise.all(elements).then(elements => finalizeSet(elements)) : finalizeSet(elements);
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: {
        value: minSize,
        message: errorUtil.toString(message)
      }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: {
        value: maxSize,
        message: errorUtil.toString(message)
      }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}

ZodSet.create = (valueType, params) => new ZodSet({
  valueType: valueType,
  minSize: null,
  maxSize: null,
  typeName: ZodFirstPartyTypeKind.ZodSet,
  ...processCreateParams(params)
});

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const {ctx: ctx} = this._processInputParams(input);
    return this._def.getter()._parse({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    });
  }
}

ZodLazy.create = (getter, params) => new ZodLazy({
  getter: getter,
  typeName: ZodFirstPartyTypeKind.ZodLazy,
  ...processCreateParams(params)
});

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      }), INVALID;
    }
    return {
      status: "valid",
      value: input.data
    };
  }
  get value() {
    return this._def.value;
  }
}

function createZodEnum(values, params) {
  return new ZodEnum({
    values: values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

ZodLiteral.create = (value, params) => new ZodLiteral({
  value: value,
  typeName: ZodFirstPartyTypeKind.ZodLiteral,
  ...processCreateParams(params)
});

class ZodEnum extends ZodType {
  _parse(input) {
    if ("string" != typeof input.data) {
      const ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
      return addIssueToContext(ctx, {
        expected: util$1.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      }), INVALID;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
      return addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      }), INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter(opt => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}

ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util$1.getValidEnumValues(this._def.values), ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util$1.objectValues(nativeEnumValues);
      return addIssueToContext(ctx, {
        expected: util$1.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      }), INVALID;
    }
    if (this._cache || (this._cache = new Set(util$1.getValidEnumValues(this._def.values))), 
    !this._cache.has(input.data)) {
      const expectedValues = util$1.objectValues(nativeEnumValues);
      return addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      }), INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}

ZodNativeEnum.create = (values, params) => new ZodNativeEnum({
  values: values,
  typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
  ...processCreateParams(params)
});

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const {ctx: ctx} = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && !1 === ctx.common.async) {
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      }), INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then(data => this._def.type.parseAsync(data, {
      path: ctx.path,
      errorMap: ctx.common.contextualErrorMap
    })));
  }
}

ZodPromise.create = (schema, params) => new ZodPromise({
  type: schema,
  typeName: ZodFirstPartyTypeKind.ZodPromise,
  ...processCreateParams(params)
});

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const {status: status, ctx: ctx} = this._processInputParams(input), effect = this._def.effect || null, checkCtx = {
      addIssue: arg => {
        addIssueToContext(ctx, arg), arg.fatal ? status.abort() : status.dirty();
      },
      get path() {
        return ctx.path;
      }
    };
    if (checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx), "preprocess" === effect.type) {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async processed => {
          if ("aborted" === status.value) {
            return INVALID;
          }
          const result = await this._def.schema._parseAsync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          return "aborted" === result.status ? INVALID : "dirty" === result.status || "dirty" === status.value ? DIRTY(result.value) : result;
        });
      }
      {
        if ("aborted" === status.value) {
          return INVALID;
        }
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        return "aborted" === result.status ? INVALID : "dirty" === result.status || "dirty" === status.value ? DIRTY(result.value) : result;
      }
    }
    if ("refinement" === effect.type) {
      const executeRefinement = acc => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (!1 === ctx.common.async) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        return "aborted" === inner.status ? INVALID : ("dirty" === inner.status && status.dirty(), 
        executeRefinement(inner.value), {
          status: status.value,
          value: inner.value
        });
      }
      return this._def.schema._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }).then(inner => "aborted" === inner.status ? INVALID : ("dirty" === inner.status && status.dirty(), 
      executeRefinement(inner.value).then(() => ({
        status: status.value,
        value: inner.value
      }))));
    }
    if ("transform" === effect.type) {
      if (!1 === ctx.common.async) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base)) {
          return INVALID;
        }
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return {
          status: status.value,
          value: result
        };
      }
      return this._def.schema._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }).then(base => isValid(base) ? Promise.resolve(effect.transform(base.value, checkCtx)).then(result => ({
        status: status.value,
        value: result
      })) : INVALID);
    }
    util$1.assertNever(effect);
  }
}

ZodEffects.create = (schema, effect, params) => new ZodEffects({
  schema: schema,
  typeName: ZodFirstPartyTypeKind.ZodEffects,
  effect: effect,
  ...processCreateParams(params)
}), ZodEffects.createWithPreprocess = (preprocess, schema, params) => new ZodEffects({
  schema: schema,
  effect: {
    type: "preprocess",
    transform: preprocess
  },
  typeName: ZodFirstPartyTypeKind.ZodEffects,
  ...processCreateParams(params)
});

class ZodOptional extends ZodType {
  _parse(input) {
    return this._getType(input) === ZodParsedType.undefined ? OK(void 0) : this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}

ZodOptional.create = (type, params) => new ZodOptional({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodOptional,
  ...processCreateParams(params)
});

class ZodNullable extends ZodType {
  _parse(input) {
    return this._getType(input) === ZodParsedType.null ? OK(null) : this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}

ZodNullable.create = (type, params) => new ZodNullable({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodNullable,
  ...processCreateParams(params)
});

class ZodDefault extends ZodType {
  _parse(input) {
    const {ctx: ctx} = this._processInputParams(input);
    let data = ctx.data;
    return ctx.parsedType === ZodParsedType.undefined && (data = this._def.defaultValue()), 
    this._def.innerType._parse({
      data: data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}

ZodDefault.create = (type, params) => new ZodDefault({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodDefault,
  defaultValue: "function" == typeof params.default ? params.default : () => params.default,
  ...processCreateParams(params)
});

class ZodCatch extends ZodType {
  _parse(input) {
    const {ctx: ctx} = this._processInputParams(input), newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    }, result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    return isAsync(result) ? result.then(result => ({
      status: "valid",
      value: "valid" === result.status ? result.value : this._def.catchValue({
        get error() {
          return new ZodError(newCtx.common.issues);
        },
        input: newCtx.data
      })
    })) : {
      status: "valid",
      value: "valid" === result.status ? result.value : this._def.catchValue({
        get error() {
          return new ZodError(newCtx.common.issues);
        },
        input: newCtx.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}

ZodCatch.create = (type, params) => new ZodCatch({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodCatch,
  catchValue: "function" == typeof params.catch ? params.catch : () => params.catch,
  ...processCreateParams(params)
});

class ZodNaN extends ZodType {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      }), INVALID;
    }
    return {
      status: "valid",
      value: input.data
    };
  }
}

ZodNaN.create = params => new ZodNaN({
  typeName: ZodFirstPartyTypeKind.ZodNaN,
  ...processCreateParams(params)
});

class ZodBranded extends ZodType {
  _parse(input) {
    const {ctx: ctx} = this._processInputParams(input), data = ctx.data;
    return this._def.type._parse({
      data: data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const {status: status, ctx: ctx} = this._processInputParams(input);
    if (ctx.common.async) {
      return (async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        return "aborted" === inResult.status ? INVALID : "dirty" === inResult.status ? (status.dirty(), 
        DIRTY(inResult.value)) : this._def.out._parseAsync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      })();
    }
    {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      return "aborted" === inResult.status ? INVALID : "dirty" === inResult.status ? (status.dirty(), 
      {
        status: "dirty",
        value: inResult.value
      }) : this._def.out._parseSync({
        data: inResult.value,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input), freeze = data => (isValid(data) && (data.value = Object.freeze(data.value)), 
    data);
    return isAsync(result) ? result.then(data => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}

function cleanParams(params, data) {
  const p = "function" == typeof params ? params(data) : "string" == typeof params ? {
    message: params
  } : params;
  return "string" == typeof p ? {
    message: p
  } : p;
}

function custom(check, _params = {}, fatal) {
  return check ? ZodAny.create().superRefine((data, ctx) => {
    const r = check(data);
    if (r instanceof Promise) {
      return r.then(r => {
        if (!r) {
          const params = cleanParams(_params, data), _fatal = params.fatal ?? fatal ?? !0;
          ctx.addIssue({
            code: "custom",
            ...params,
            fatal: _fatal
          });
        }
      });
    }
    if (!r) {
      const params = cleanParams(_params, data), _fatal = params.fatal ?? fatal ?? !0;
      ctx.addIssue({
        code: "custom",
        ...params,
        fatal: _fatal
      });
    }
  }) : ZodAny.create();
}

var ZodFirstPartyTypeKind;

ZodReadonly.create = (type, params) => new ZodReadonly({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodReadonly,
  ...processCreateParams(params)
}), function(ZodFirstPartyTypeKind) {
  ZodFirstPartyTypeKind.ZodString = "ZodString", ZodFirstPartyTypeKind.ZodNumber = "ZodNumber", 
  ZodFirstPartyTypeKind.ZodNaN = "ZodNaN", ZodFirstPartyTypeKind.ZodBigInt = "ZodBigInt", 
  ZodFirstPartyTypeKind.ZodBoolean = "ZodBoolean", ZodFirstPartyTypeKind.ZodDate = "ZodDate", 
  ZodFirstPartyTypeKind.ZodSymbol = "ZodSymbol", ZodFirstPartyTypeKind.ZodUndefined = "ZodUndefined", 
  ZodFirstPartyTypeKind.ZodNull = "ZodNull", ZodFirstPartyTypeKind.ZodAny = "ZodAny", 
  ZodFirstPartyTypeKind.ZodUnknown = "ZodUnknown", ZodFirstPartyTypeKind.ZodNever = "ZodNever", 
  ZodFirstPartyTypeKind.ZodVoid = "ZodVoid", ZodFirstPartyTypeKind.ZodArray = "ZodArray", 
  ZodFirstPartyTypeKind.ZodObject = "ZodObject", ZodFirstPartyTypeKind.ZodUnion = "ZodUnion", 
  ZodFirstPartyTypeKind.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", ZodFirstPartyTypeKind.ZodIntersection = "ZodIntersection", 
  ZodFirstPartyTypeKind.ZodTuple = "ZodTuple", ZodFirstPartyTypeKind.ZodRecord = "ZodRecord", 
  ZodFirstPartyTypeKind.ZodMap = "ZodMap", ZodFirstPartyTypeKind.ZodSet = "ZodSet", 
  ZodFirstPartyTypeKind.ZodFunction = "ZodFunction", ZodFirstPartyTypeKind.ZodLazy = "ZodLazy", 
  ZodFirstPartyTypeKind.ZodLiteral = "ZodLiteral", ZodFirstPartyTypeKind.ZodEnum = "ZodEnum", 
  ZodFirstPartyTypeKind.ZodEffects = "ZodEffects", ZodFirstPartyTypeKind.ZodNativeEnum = "ZodNativeEnum", 
  ZodFirstPartyTypeKind.ZodOptional = "ZodOptional", ZodFirstPartyTypeKind.ZodNullable = "ZodNullable", 
  ZodFirstPartyTypeKind.ZodDefault = "ZodDefault", ZodFirstPartyTypeKind.ZodCatch = "ZodCatch", 
  ZodFirstPartyTypeKind.ZodPromise = "ZodPromise", ZodFirstPartyTypeKind.ZodBranded = "ZodBranded", 
  ZodFirstPartyTypeKind.ZodPipeline = "ZodPipeline", ZodFirstPartyTypeKind.ZodReadonly = "ZodReadonly";
}(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));

const instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom(data => data instanceof cls, params), numberType = ZodNumber.create;

ZodAny.create, ZodNever.create, ZodArray.create;

const objectType = ZodObject.create, unionType = ZodUnion.create;

ZodIntersection.create, ZodTuple.create, ZodEnum.create;

const nativeEnumType = ZodNativeEnum.create;

var Edge;

function _typeof(obj) {
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
    return typeof obj;
  } : function(obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

ZodPromise.create, ZodOptional.create, ZodNullable.create, function(Edge) {
  Edge[Edge.EXTEND = 1] = "EXTEND", Edge[Edge.WRAP = 2] = "WRAP", Edge[Edge.CROP = 3] = "CROP";
}(Edge || (Edge = {})), objectType({
  bitmap: objectType({
    data: unionType([ instanceOfType(Buffer), instanceOfType(Uint8Array) ]),
    width: numberType(),
    height: numberType()
  })
});

var trimLeft = /^\s+/, trimRight = /\s+$/;

function tinycolor(color, opts) {
  if (opts = opts || {}, (color = color || "") instanceof tinycolor) {
    return color;
  }
  if (!(this instanceof tinycolor)) {
    return new tinycolor(color, opts);
  }
  var rgb = inputToRGB(color);
  this._originalInput = color, this._r = rgb.r, this._g = rgb.g, this._b = rgb.b, 
  this._a = rgb.a, this._roundA = Math.round(100 * this._a) / 100, this._format = opts.format || rgb.format, 
  this._gradientType = opts.gradientType, this._r < 1 && (this._r = Math.round(this._r)), 
  this._g < 1 && (this._g = Math.round(this._g)), this._b < 1 && (this._b = Math.round(this._b)), 
  this._ok = rgb.ok;
}

function inputToRGB(color) {
  var rgb = {
    r: 0,
    g: 0,
    b: 0
  }, a = 1, s = null, v = null, l = null, ok = !1, format = !1;
  return "string" == typeof color && (color = stringInputToObject(color)), "object" == _typeof(color) && (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b) ? (rgb = rgbToRgb(color.r, color.g, color.b), 
  ok = !0, format = "%" === String(color.r).substr(-1) ? "prgb" : "rgb") : isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v) ? (s = convertToPercentage(color.s), 
  v = convertToPercentage(color.v), rgb = hsvToRgb(color.h, s, v), ok = !0, format = "hsv") : isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l) && (s = convertToPercentage(color.s), 
  l = convertToPercentage(color.l), rgb = hslToRgb(color.h, s, l), ok = !0, format = "hsl"), 
  color.hasOwnProperty("a") && (a = color.a)), a = boundAlpha(a), {
    ok: ok,
    format: color.format || format,
    r: Math.min(255, Math.max(rgb.r, 0)),
    g: Math.min(255, Math.max(rgb.g, 0)),
    b: Math.min(255, Math.max(rgb.b, 0)),
    a: a
  };
}

function rgbToRgb(r, g, b) {
  return {
    r: 255 * bound01(r, 255),
    g: 255 * bound01(g, 255),
    b: 255 * bound01(b, 255)
  };
}

function rgbToHsl(r, g, b) {
  r = bound01(r, 255), g = bound01(g, 255), b = bound01(b, 255);
  var h, s, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max == min) {
    h = s = 0;
  } else {
    var d = max - min;
    switch (s = l > .5 ? d / (2 - max - min) : d / (max + min), max) {
     case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;

     case g:
      h = (b - r) / d + 2;
      break;

     case b:
      h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return {
    h: h,
    s: s,
    l: l
  };
}

function hslToRgb(h, s, l) {
  var r, g, b;
  function hue2rgb(p, q, t) {
    return t < 0 && (t += 1), t > 1 && (t -= 1), t < 1 / 6 ? p + 6 * (q - p) * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  }
  if (h = bound01(h, 360), s = bound01(s, 100), l = bound01(l, 100), 0 === s) {
    r = g = b = l;
  } else {
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3), g = hue2rgb(p, q, h), b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: 255 * r,
    g: 255 * g,
    b: 255 * b
  };
}

function rgbToHsv(r, g, b) {
  r = bound01(r, 255), g = bound01(g, 255), b = bound01(b, 255);
  var h, s, max = Math.max(r, g, b), min = Math.min(r, g, b), v = max, d = max - min;
  if (s = 0 === max ? 0 : d / max, max == min) {
    h = 0;
  } else {
    switch (max) {
     case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;

     case g:
      h = (b - r) / d + 2;
      break;

     case b:
      h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return {
    h: h,
    s: s,
    v: v
  };
}

function hsvToRgb(h, s, v) {
  h = 6 * bound01(h, 360), s = bound01(s, 100), v = bound01(v, 100);
  var i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), mod = i % 6;
  return {
    r: 255 * [ v, q, p, p, t, v ][mod],
    g: 255 * [ t, v, v, q, p, p ][mod],
    b: 255 * [ p, p, t, v, v, q ][mod]
  };
}

function rgbToHex(r, g, b, allow3Char) {
  var hex = [ pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16)) ];
  return allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) ? hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) : hex.join("");
}

function rgbaToHex(r, g, b, a, allow4Char) {
  var hex = [ pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16)), pad2(convertDecimalToHex(a)) ];
  return allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1) ? hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0) : hex.join("");
}

function rgbaToArgbHex(r, g, b, a) {
  return [ pad2(convertDecimalToHex(a)), pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16)) ].join("");
}

function _desaturate(color, amount) {
  amount = 0 === amount ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  return hsl.s -= amount / 100, hsl.s = clamp01(hsl.s), tinycolor(hsl);
}

function _saturate(color, amount) {
  amount = 0 === amount ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  return hsl.s += amount / 100, hsl.s = clamp01(hsl.s), tinycolor(hsl);
}

function _greyscale(color) {
  return tinycolor(color).desaturate(100);
}

function _lighten(color, amount) {
  amount = 0 === amount ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  return hsl.l += amount / 100, hsl.l = clamp01(hsl.l), tinycolor(hsl);
}

function _brighten(color, amount) {
  amount = 0 === amount ? 0 : amount || 10;
  var rgb = tinycolor(color).toRgb();
  return rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(-amount / 100 * 255))), 
  rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(-amount / 100 * 255))), rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(-amount / 100 * 255))), 
  tinycolor(rgb);
}

function _darken(color, amount) {
  amount = 0 === amount ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  return hsl.l -= amount / 100, hsl.l = clamp01(hsl.l), tinycolor(hsl);
}

function _spin(color, amount) {
  var hsl = tinycolor(color).toHsl(), hue = (hsl.h + amount) % 360;
  return hsl.h = hue < 0 ? 360 + hue : hue, tinycolor(hsl);
}

function _complement(color) {
  var hsl = tinycolor(color).toHsl();
  return hsl.h = (hsl.h + 180) % 360, tinycolor(hsl);
}

function polyad(color, number) {
  if (isNaN(number) || number <= 0) {
    throw new Error("Argument to polyad must be a positive number");
  }
  for (var hsl = tinycolor(color).toHsl(), result = [ tinycolor(color) ], step = 360 / number, i = 1; i < number; i++) {
    result.push(tinycolor({
      h: (hsl.h + i * step) % 360,
      s: hsl.s,
      l: hsl.l
    }));
  }
  return result;
}

function _splitcomplement(color) {
  var hsl = tinycolor(color).toHsl(), h = hsl.h;
  return [ tinycolor(color), tinycolor({
    h: (h + 72) % 360,
    s: hsl.s,
    l: hsl.l
  }), tinycolor({
    h: (h + 216) % 360,
    s: hsl.s,
    l: hsl.l
  }) ];
}

function _analogous(color, results, slices) {
  results = results || 6, slices = slices || 30;
  var hsl = tinycolor(color).toHsl(), part = 360 / slices, ret = [ tinycolor(color) ];
  for (hsl.h = (hsl.h - (part * results >> 1) + 720) % 360; --results; ) {
    hsl.h = (hsl.h + part) % 360, ret.push(tinycolor(hsl));
  }
  return ret;
}

function _monochromatic(color, results) {
  results = results || 6;
  for (var hsv = tinycolor(color).toHsv(), h = hsv.h, s = hsv.s, v = hsv.v, ret = [], modification = 1 / results; results--; ) {
    ret.push(tinycolor({
      h: h,
      s: s,
      v: v
    })), v = (v + modification) % 1;
  }
  return ret;
}

tinycolor.prototype = {
  isDark: function() {
    return this.getBrightness() < 128;
  },
  isLight: function() {
    return !this.isDark();
  },
  isValid: function() {
    return this._ok;
  },
  getOriginalInput: function() {
    return this._originalInput;
  },
  getFormat: function() {
    return this._format;
  },
  getAlpha: function() {
    return this._a;
  },
  getBrightness: function() {
    var rgb = this.toRgb();
    return (299 * rgb.r + 587 * rgb.g + 114 * rgb.b) / 1e3;
  },
  getLuminance: function() {
    var RsRGB, GsRGB, BsRGB, rgb = this.toRgb();
    return RsRGB = rgb.r / 255, GsRGB = rgb.g / 255, BsRGB = rgb.b / 255, .2126 * (RsRGB <= .03928 ? RsRGB / 12.92 : Math.pow((RsRGB + .055) / 1.055, 2.4)) + .7152 * (GsRGB <= .03928 ? GsRGB / 12.92 : Math.pow((GsRGB + .055) / 1.055, 2.4)) + .0722 * (BsRGB <= .03928 ? BsRGB / 12.92 : Math.pow((BsRGB + .055) / 1.055, 2.4));
  },
  setAlpha: function(value) {
    return this._a = boundAlpha(value), this._roundA = Math.round(100 * this._a) / 100, 
    this;
  },
  toHsv: function() {
    var hsv = rgbToHsv(this._r, this._g, this._b);
    return {
      h: 360 * hsv.h,
      s: hsv.s,
      v: hsv.v,
      a: this._a
    };
  },
  toHsvString: function() {
    var hsv = rgbToHsv(this._r, this._g, this._b), h = Math.round(360 * hsv.h), s = Math.round(100 * hsv.s), v = Math.round(100 * hsv.v);
    return 1 == this._a ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")";
  },
  toHsl: function() {
    var hsl = rgbToHsl(this._r, this._g, this._b);
    return {
      h: 360 * hsl.h,
      s: hsl.s,
      l: hsl.l,
      a: this._a
    };
  },
  toHslString: function() {
    var hsl = rgbToHsl(this._r, this._g, this._b), h = Math.round(360 * hsl.h), s = Math.round(100 * hsl.s), l = Math.round(100 * hsl.l);
    return 1 == this._a ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")";
  },
  toHex: function(allow3Char) {
    return rgbToHex(this._r, this._g, this._b, allow3Char);
  },
  toHexString: function(allow3Char) {
    return "#" + this.toHex(allow3Char);
  },
  toHex8: function(allow4Char) {
    return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
  },
  toHex8String: function(allow4Char) {
    return "#" + this.toHex8(allow4Char);
  },
  toRgb: function() {
    return {
      r: Math.round(this._r),
      g: Math.round(this._g),
      b: Math.round(this._b),
      a: this._a
    };
  },
  toRgbString: function() {
    return 1 == this._a ? "rgb(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ")" : "rgba(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ", " + this._roundA + ")";
  },
  toPercentageRgb: function() {
    return {
      r: Math.round(100 * bound01(this._r, 255)) + "%",
      g: Math.round(100 * bound01(this._g, 255)) + "%",
      b: Math.round(100 * bound01(this._b, 255)) + "%",
      a: this._a
    };
  },
  toPercentageRgbString: function() {
    return 1 == this._a ? "rgb(" + Math.round(100 * bound01(this._r, 255)) + "%, " + Math.round(100 * bound01(this._g, 255)) + "%, " + Math.round(100 * bound01(this._b, 255)) + "%)" : "rgba(" + Math.round(100 * bound01(this._r, 255)) + "%, " + Math.round(100 * bound01(this._g, 255)) + "%, " + Math.round(100 * bound01(this._b, 255)) + "%, " + this._roundA + ")";
  },
  toName: function() {
    return 0 === this._a ? "transparent" : !(this._a < 1) && (hexNames[rgbToHex(this._r, this._g, this._b, !0)] || !1);
  },
  toFilter: function(secondColor) {
    var hex8String = "#" + rgbaToArgbHex(this._r, this._g, this._b, this._a), secondHex8String = hex8String, gradientType = this._gradientType ? "GradientType = 1, " : "";
    if (secondColor) {
      var s = tinycolor(secondColor);
      secondHex8String = "#" + rgbaToArgbHex(s._r, s._g, s._b, s._a);
    }
    return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")";
  },
  toString: function(format) {
    var formatSet = !!format;
    format = format || this._format;
    var formattedString = !1, hasAlpha = this._a < 1 && this._a >= 0;
    return formatSet || !hasAlpha || "hex" !== format && "hex6" !== format && "hex3" !== format && "hex4" !== format && "hex8" !== format && "name" !== format ? ("rgb" === format && (formattedString = this.toRgbString()), 
    "prgb" === format && (formattedString = this.toPercentageRgbString()), "hex" !== format && "hex6" !== format || (formattedString = this.toHexString()), 
    "hex3" === format && (formattedString = this.toHexString(!0)), "hex4" === format && (formattedString = this.toHex8String(!0)), 
    "hex8" === format && (formattedString = this.toHex8String()), "name" === format && (formattedString = this.toName()), 
    "hsl" === format && (formattedString = this.toHslString()), "hsv" === format && (formattedString = this.toHsvString()), 
    formattedString || this.toHexString()) : "name" === format && 0 === this._a ? this.toName() : this.toRgbString();
  },
  clone: function() {
    return tinycolor(this.toString());
  },
  _applyModification: function(fn, args) {
    var color = fn.apply(null, [ this ].concat([].slice.call(args)));
    return this._r = color._r, this._g = color._g, this._b = color._b, this.setAlpha(color._a), 
    this;
  },
  lighten: function() {
    return this._applyModification(_lighten, arguments);
  },
  brighten: function() {
    return this._applyModification(_brighten, arguments);
  },
  darken: function() {
    return this._applyModification(_darken, arguments);
  },
  desaturate: function() {
    return this._applyModification(_desaturate, arguments);
  },
  saturate: function() {
    return this._applyModification(_saturate, arguments);
  },
  greyscale: function() {
    return this._applyModification(_greyscale, arguments);
  },
  spin: function() {
    return this._applyModification(_spin, arguments);
  },
  _applyCombination: function(fn, args) {
    return fn.apply(null, [ this ].concat([].slice.call(args)));
  },
  analogous: function() {
    return this._applyCombination(_analogous, arguments);
  },
  complement: function() {
    return this._applyCombination(_complement, arguments);
  },
  monochromatic: function() {
    return this._applyCombination(_monochromatic, arguments);
  },
  splitcomplement: function() {
    return this._applyCombination(_splitcomplement, arguments);
  },
  triad: function() {
    return this._applyCombination(polyad, [ 3 ]);
  },
  tetrad: function() {
    return this._applyCombination(polyad, [ 4 ]);
  }
}, tinycolor.fromRatio = function(color, opts) {
  if ("object" == _typeof(color)) {
    var newColor = {};
    for (var i in color) {
      color.hasOwnProperty(i) && (newColor[i] = "a" === i ? color[i] : convertToPercentage(color[i]));
    }
    color = newColor;
  }
  return tinycolor(color, opts);
}, tinycolor.equals = function(color1, color2) {
  return !(!color1 || !color2) && tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
}, tinycolor.random = function() {
  return tinycolor.fromRatio({
    r: Math.random(),
    g: Math.random(),
    b: Math.random()
  });
}, tinycolor.mix = function(color1, color2, amount) {
  amount = 0 === amount ? 0 : amount || 50;
  var rgb1 = tinycolor(color1).toRgb(), rgb2 = tinycolor(color2).toRgb(), p = amount / 100;
  return tinycolor({
    r: (rgb2.r - rgb1.r) * p + rgb1.r,
    g: (rgb2.g - rgb1.g) * p + rgb1.g,
    b: (rgb2.b - rgb1.b) * p + rgb1.b,
    a: (rgb2.a - rgb1.a) * p + rgb1.a
  });
}, tinycolor.readability = function(color1, color2) {
  var c1 = tinycolor(color1), c2 = tinycolor(color2);
  return (Math.max(c1.getLuminance(), c2.getLuminance()) + .05) / (Math.min(c1.getLuminance(), c2.getLuminance()) + .05);
}, tinycolor.isReadable = function(color1, color2, wcag2) {
  var wcag2Parms, out, readability = tinycolor.readability(color1, color2);
  switch (out = !1, (wcag2Parms = validateWCAG2Parms(wcag2)).level + wcag2Parms.size) {
   case "AAsmall":
   case "AAAlarge":
    out = readability >= 4.5;
    break;

   case "AAlarge":
    out = readability >= 3;
    break;

   case "AAAsmall":
    out = readability >= 7;
  }
  return out;
}, tinycolor.mostReadable = function(baseColor, colorList, args) {
  var readability, includeFallbackColors, level, size, bestColor = null, bestScore = 0;
  includeFallbackColors = (args = args || {}).includeFallbackColors, level = args.level, 
  size = args.size;
  for (var i = 0; i < colorList.length; i++) {
    (readability = tinycolor.readability(baseColor, colorList[i])) > bestScore && (bestScore = readability, 
    bestColor = tinycolor(colorList[i]));
  }
  return tinycolor.isReadable(baseColor, bestColor, {
    level: level,
    size: size
  }) || !includeFallbackColors ? bestColor : (args.includeFallbackColors = !1, tinycolor.mostReadable(baseColor, [ "#fff", "#000" ], args));
};

var names$1 = tinycolor.names = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "0ff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000",
  blanchedalmond: "ffebcd",
  blue: "00f",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  burntsienna: "ea7e5d",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "0ff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgreen: "006400",
  darkgrey: "a9a9a9",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "f0f",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  green: "008000",
  greenyellow: "adff2f",
  grey: "808080",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgreen: "90ee90",
  lightgrey: "d3d3d3",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "789",
  lightslategrey: "789",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "0f0",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "f0f",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "663399",
  red: "f00",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "fff",
  whitesmoke: "f5f5f5",
  yellow: "ff0",
  yellowgreen: "9acd32"
}, hexNames = tinycolor.hexNames = flip(names$1);

function flip(o) {
  var flipped = {};
  for (var i in o) {
    o.hasOwnProperty(i) && (flipped[o[i]] = i);
  }
  return flipped;
}

function boundAlpha(a) {
  return a = parseFloat(a), (isNaN(a) || a < 0 || a > 1) && (a = 1), a;
}

function bound01(n, max) {
  isOnePointZero(n) && (n = "100%");
  var processPercent = isPercentage(n);
  return n = Math.min(max, Math.max(0, parseFloat(n))), processPercent && (n = parseInt(n * max, 10) / 100), 
  Math.abs(n - max) < 1e-6 ? 1 : n % max / parseFloat(max);
}

function clamp01(val) {
  return Math.min(1, Math.max(0, val));
}

function parseIntFromHex(val) {
  return parseInt(val, 16);
}

function isOnePointZero(n) {
  return "string" == typeof n && -1 != n.indexOf(".") && 1 === parseFloat(n);
}

function isPercentage(n) {
  return "string" == typeof n && -1 != n.indexOf("%");
}

function pad2(c) {
  return 1 == c.length ? "0" + c : "" + c;
}

function convertToPercentage(n) {
  return n <= 1 && (n = 100 * n + "%"), n;
}

function convertDecimalToHex(d) {
  return Math.round(255 * parseFloat(d)).toString(16);
}

function convertHexToDecimal(h) {
  return parseIntFromHex(h) / 255;
}

var matchers = (CSS_UNIT = "(?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?)", PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?", 
PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?", 
{
  CSS_UNIT: new RegExp(CSS_UNIT),
  rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
  rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
  hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
  hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
  hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
  hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
  hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
  hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
  hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
  hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
}), CSS_UNIT, PERMISSIVE_MATCH3, PERMISSIVE_MATCH4;

function isValidCSSUnit(color) {
  return !!matchers.CSS_UNIT.exec(color);
}

function stringInputToObject(color) {
  color = color.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
  var match, named = !1;
  if (names$1[color]) {
    color = names$1[color], named = !0;
  } else if ("transparent" == color) {
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
      format: "name"
    };
  }
  return (match = matchers.rgb.exec(color)) ? {
    r: match[1],
    g: match[2],
    b: match[3]
  } : (match = matchers.rgba.exec(color)) ? {
    r: match[1],
    g: match[2],
    b: match[3],
    a: match[4]
  } : (match = matchers.hsl.exec(color)) ? {
    h: match[1],
    s: match[2],
    l: match[3]
  } : (match = matchers.hsla.exec(color)) ? {
    h: match[1],
    s: match[2],
    l: match[3],
    a: match[4]
  } : (match = matchers.hsv.exec(color)) ? {
    h: match[1],
    s: match[2],
    v: match[3]
  } : (match = matchers.hsva.exec(color)) ? {
    h: match[1],
    s: match[2],
    v: match[3],
    a: match[4]
  } : (match = matchers.hex8.exec(color)) ? {
    r: parseIntFromHex(match[1]),
    g: parseIntFromHex(match[2]),
    b: parseIntFromHex(match[3]),
    a: convertHexToDecimal(match[4]),
    format: named ? "name" : "hex8"
  } : (match = matchers.hex6.exec(color)) ? {
    r: parseIntFromHex(match[1]),
    g: parseIntFromHex(match[2]),
    b: parseIntFromHex(match[3]),
    format: named ? "name" : "hex"
  } : (match = matchers.hex4.exec(color)) ? {
    r: parseIntFromHex(match[1] + "" + match[1]),
    g: parseIntFromHex(match[2] + "" + match[2]),
    b: parseIntFromHex(match[3] + "" + match[3]),
    a: convertHexToDecimal(match[4] + "" + match[4]),
    format: named ? "name" : "hex8"
  } : !!(match = matchers.hex3.exec(color)) && {
    r: parseIntFromHex(match[1] + "" + match[1]),
    g: parseIntFromHex(match[2] + "" + match[2]),
    b: parseIntFromHex(match[3] + "" + match[3]),
    format: named ? "name" : "hex"
  };
}

function validateWCAG2Parms(parms) {
  var level, size;
  return "AA" !== (level = ((parms = parms || {
    level: "AA",
    size: "small"
  }).level || "AA").toUpperCase()) && "AAA" !== level && (level = "AA"), "small" !== (size = (parms.size || "small").toLowerCase()) && "large" !== size && (size = "small"), 
  {
    level: level,
    size: size
  };
}

function scan(image, xArg, yArg, wArg, hArg, cbArg) {
  let x, y, w, h, cb;
  if ("function" == typeof xArg) {
    cb = xArg, x = 0, y = 0, w = image.bitmap.width, h = image.bitmap.height;
  } else {
    if (x = xArg, "number" != typeof yArg) {
      throw new Error("y must be a number");
    }
    if (y = yArg, "number" != typeof wArg) {
      throw new Error("w must be a number");
    }
    if (w = wArg, "number" != typeof hArg) {
      throw new Error("h must be a number");
    }
    if (h = hArg, "function" != typeof cbArg) {
      throw new Error("cb must be a function");
    }
    cb = cbArg;
  }
  x = Math.round(x), y = Math.round(y), w = Math.round(w), h = Math.round(h);
  const bound = cb.bind(image);
  for (let _y = y; _y < y + h; _y++) {
    for (let _x = x; _x < x + w; _x++) {
      bound(_x, _y, image.bitmap.width * _y + _x << 2);
    }
  }
  return image;
}

function* scanIterator(image, x, y, w, h) {
  x = Math.round(x), y = Math.round(y), w = Math.round(w), h = Math.round(h);
  for (let _y = y; _y < y + h; _y++) {
    for (let _x = x; _x < x + w; _x++) {
      const idx = image.bitmap.width * _y + _x << 2;
      yield {
        x: _x,
        y: _y,
        idx: idx,
        image: image
      };
    }
  }
}

function limit255(n) {
  return n = Math.max(n, 0), n = Math.min(n, 255);
}

function cssColorToHex(cssColor) {
  return "number" == typeof cssColor ? cssColor : parseInt(tinycolor(cssColor).toHex8(), 16);
}

var lib$1 = {}, hasRequiredLib$1;

function requireLib$1() {
  return hasRequiredLib$1 || (hasRequiredLib$1 = 1, function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.AnsiStringType = exports.StringType = exports.BufferType = exports.Uint8ArrayType = exports.IgnoreType = exports.Float80_LE = exports.Float80_BE = exports.Float64_LE = exports.Float64_BE = exports.Float32_LE = exports.Float32_BE = exports.Float16_LE = exports.Float16_BE = exports.INT64_BE = exports.UINT64_BE = exports.INT64_LE = exports.UINT64_LE = exports.INT32_LE = exports.INT32_BE = exports.INT24_BE = exports.INT24_LE = exports.INT16_LE = exports.INT16_BE = exports.INT8 = exports.UINT32_BE = exports.UINT32_LE = exports.UINT24_BE = exports.UINT24_LE = exports.UINT16_BE = exports.UINT16_LE = exports.UINT8 = void 0;
    const ieee754 = requireIeee754();
    function dv(array) {
      return new DataView(array.buffer, array.byteOffset);
    }
    exports.UINT8 = {
      len: 1,
      get: (array, offset) => dv(array).getUint8(offset),
      put: (array, offset, value) => (dv(array).setUint8(offset, value), offset + 1)
    }, exports.UINT16_LE = {
      len: 2,
      get: (array, offset) => dv(array).getUint16(offset, !0),
      put: (array, offset, value) => (dv(array).setUint16(offset, value, !0), offset + 2)
    }, exports.UINT16_BE = {
      len: 2,
      get: (array, offset) => dv(array).getUint16(offset),
      put: (array, offset, value) => (dv(array).setUint16(offset, value), offset + 2)
    }, exports.UINT24_LE = {
      len: 3,
      get(array, offset) {
        const dataView = dv(array);
        return dataView.getUint8(offset) + (dataView.getUint16(offset + 1, !0) << 8);
      },
      put(array, offset, value) {
        const dataView = dv(array);
        return dataView.setUint8(offset, 255 & value), dataView.setUint16(offset + 1, value >> 8, !0), 
        offset + 3;
      }
    }, exports.UINT24_BE = {
      len: 3,
      get(array, offset) {
        const dataView = dv(array);
        return (dataView.getUint16(offset) << 8) + dataView.getUint8(offset + 2);
      },
      put(array, offset, value) {
        const dataView = dv(array);
        return dataView.setUint16(offset, value >> 8), dataView.setUint8(offset + 2, 255 & value), 
        offset + 3;
      }
    }, exports.UINT32_LE = {
      len: 4,
      get: (array, offset) => dv(array).getUint32(offset, !0),
      put: (array, offset, value) => (dv(array).setUint32(offset, value, !0), offset + 4)
    }, exports.UINT32_BE = {
      len: 4,
      get: (array, offset) => dv(array).getUint32(offset),
      put: (array, offset, value) => (dv(array).setUint32(offset, value), offset + 4)
    }, exports.INT8 = {
      len: 1,
      get: (array, offset) => dv(array).getInt8(offset),
      put: (array, offset, value) => (dv(array).setInt8(offset, value), offset + 1)
    }, exports.INT16_BE = {
      len: 2,
      get: (array, offset) => dv(array).getInt16(offset),
      put: (array, offset, value) => (dv(array).setInt16(offset, value), offset + 2)
    }, exports.INT16_LE = {
      len: 2,
      get: (array, offset) => dv(array).getInt16(offset, !0),
      put: (array, offset, value) => (dv(array).setInt16(offset, value, !0), offset + 2)
    }, exports.INT24_LE = {
      len: 3,
      get(array, offset) {
        const unsigned = exports.UINT24_LE.get(array, offset);
        return unsigned > 8388607 ? unsigned - 16777216 : unsigned;
      },
      put(array, offset, value) {
        const dataView = dv(array);
        return dataView.setUint8(offset, 255 & value), dataView.setUint16(offset + 1, value >> 8, !0), 
        offset + 3;
      }
    }, exports.INT24_BE = {
      len: 3,
      get(array, offset) {
        const unsigned = exports.UINT24_BE.get(array, offset);
        return unsigned > 8388607 ? unsigned - 16777216 : unsigned;
      },
      put(array, offset, value) {
        const dataView = dv(array);
        return dataView.setUint16(offset, value >> 8), dataView.setUint8(offset + 2, 255 & value), 
        offset + 3;
      }
    }, exports.INT32_BE = {
      len: 4,
      get: (array, offset) => dv(array).getInt32(offset),
      put: (array, offset, value) => (dv(array).setInt32(offset, value), offset + 4)
    }, exports.INT32_LE = {
      len: 4,
      get: (array, offset) => dv(array).getInt32(offset, !0),
      put: (array, offset, value) => (dv(array).setInt32(offset, value, !0), offset + 4)
    }, exports.UINT64_LE = {
      len: 8,
      get: (array, offset) => dv(array).getBigUint64(offset, !0),
      put: (array, offset, value) => (dv(array).setBigUint64(offset, value, !0), offset + 8)
    }, exports.INT64_LE = {
      len: 8,
      get: (array, offset) => dv(array).getBigInt64(offset, !0),
      put: (array, offset, value) => (dv(array).setBigInt64(offset, value, !0), offset + 8)
    }, exports.UINT64_BE = {
      len: 8,
      get: (array, offset) => dv(array).getBigUint64(offset),
      put: (array, offset, value) => (dv(array).setBigUint64(offset, value), offset + 8)
    }, exports.INT64_BE = {
      len: 8,
      get: (array, offset) => dv(array).getBigInt64(offset),
      put: (array, offset, value) => (dv(array).setBigInt64(offset, value), offset + 8)
    }, exports.Float16_BE = {
      len: 2,
      get(dataView, offset) {
        return ieee754.read(dataView, offset, !1, 10, this.len);
      },
      put(dataView, offset, value) {
        return ieee754.write(dataView, value, offset, !1, 10, this.len), offset + this.len;
      }
    }, exports.Float16_LE = {
      len: 2,
      get(array, offset) {
        return ieee754.read(array, offset, !0, 10, this.len);
      },
      put(array, offset, value) {
        return ieee754.write(array, value, offset, !0, 10, this.len), offset + this.len;
      }
    }, exports.Float32_BE = {
      len: 4,
      get: (array, offset) => dv(array).getFloat32(offset),
      put: (array, offset, value) => (dv(array).setFloat32(offset, value), offset + 4)
    }, exports.Float32_LE = {
      len: 4,
      get: (array, offset) => dv(array).getFloat32(offset, !0),
      put: (array, offset, value) => (dv(array).setFloat32(offset, value, !0), offset + 4)
    }, exports.Float64_BE = {
      len: 8,
      get: (array, offset) => dv(array).getFloat64(offset),
      put: (array, offset, value) => (dv(array).setFloat64(offset, value), offset + 8)
    }, exports.Float64_LE = {
      len: 8,
      get: (array, offset) => dv(array).getFloat64(offset, !0),
      put: (array, offset, value) => (dv(array).setFloat64(offset, value, !0), offset + 8)
    }, exports.Float80_BE = {
      len: 10,
      get(array, offset) {
        return ieee754.read(array, offset, !1, 63, this.len);
      },
      put(array, offset, value) {
        return ieee754.write(array, value, offset, !1, 63, this.len), offset + this.len;
      }
    }, exports.Float80_LE = {
      len: 10,
      get(array, offset) {
        return ieee754.read(array, offset, !0, 63, this.len);
      },
      put(array, offset, value) {
        return ieee754.write(array, value, offset, !0, 63, this.len), offset + this.len;
      }
    };
    exports.IgnoreType = class {
      constructor(len) {
        this.len = len;
      }
      get(array, off) {}
    };
    exports.Uint8ArrayType = class {
      constructor(len) {
        this.len = len;
      }
      get(array, offset) {
        return array.subarray(offset, offset + this.len);
      }
    };
    exports.BufferType = class {
      constructor(len) {
        this.len = len;
      }
      get(uint8Array, off) {
        return Buffer.from(uint8Array.subarray(off, off + this.len));
      }
    };
    exports.StringType = class {
      constructor(len, encoding) {
        this.len = len, this.encoding = encoding;
      }
      get(uint8Array, offset) {
        return Buffer.from(uint8Array).toString(this.encoding, offset, offset + this.len);
      }
    };
    class AnsiStringType {
      constructor(len) {
        this.len = len;
      }
      static decode(buffer, offset, until) {
        let str = "";
        for (let i = offset; i < until; ++i) {
          str += AnsiStringType.codePointToString(AnsiStringType.singleByteDecoder(buffer[i]));
        }
        return str;
      }
      static inRange(a, min, max) {
        return min <= a && a <= max;
      }
      static codePointToString(cp) {
        return cp <= 65535 ? String.fromCharCode(cp) : (cp -= 65536, String.fromCharCode(55296 + (cp >> 10), 56320 + (1023 & cp)));
      }
      static singleByteDecoder(bite) {
        if (AnsiStringType.inRange(bite, 0, 127)) {
          return bite;
        }
        const codePoint = AnsiStringType.windows1252[bite - 128];
        if (null === codePoint) {
          throw Error("invaliding encoding");
        }
        return codePoint;
      }
      get(buffer, offset = 0) {
        return AnsiStringType.decode(buffer, offset, offset + this.len);
      }
    }
    exports.AnsiStringType = AnsiStringType, AnsiStringType.windows1252 = [ 8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 141, 381, 143, 144, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 157, 382, 376, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255 ];
  }(lib$1)), lib$1;
}

var core$1 = {}, ReadStreamTokenizer = {}, AbstractTokenizer = {}, lib = {}, EndOfFileStream = {}, hasRequiredEndOfFileStream;

function requireEndOfFileStream() {
  return hasRequiredEndOfFileStream || (hasRequiredEndOfFileStream = 1, function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.EndOfStreamError = exports.defaultMessages = void 0, exports.defaultMessages = "End-Of-Stream";
    class EndOfStreamError extends Error {
      constructor() {
        super(exports.defaultMessages);
      }
    }
    exports.EndOfStreamError = EndOfStreamError;
  }(EndOfFileStream)), EndOfFileStream;
}

var StreamReader = {}, Deferred = {}, hasRequiredDeferred, hasRequiredStreamReader, hasRequiredLib, hasRequiredAbstractTokenizer, hasRequiredReadStreamTokenizer;

function requireDeferred() {
  if (hasRequiredDeferred) {
    return Deferred;
  }
  hasRequiredDeferred = 1, Object.defineProperty(Deferred, "__esModule", {
    value: !0
  }), Deferred.Deferred = void 0;
  return Deferred.Deferred = class {
    constructor() {
      this.resolve = () => null, this.reject = () => null, this.promise = new Promise((resolve, reject) => {
        this.reject = reject, this.resolve = resolve;
      });
    }
  }, Deferred;
}

function requireStreamReader() {
  return hasRequiredStreamReader || (hasRequiredStreamReader = 1, function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.StreamReader = exports.EndOfStreamError = void 0;
    const EndOfFileStream_1 = requireEndOfFileStream(), Deferred_1 = requireDeferred();
    var EndOfFileStream_2 = requireEndOfFileStream();
    Object.defineProperty(exports, "EndOfStreamError", {
      enumerable: !0,
      get: function() {
        return EndOfFileStream_2.EndOfStreamError;
      }
    });
    exports.StreamReader = class {
      constructor(s) {
        if (this.s = s, this.deferred = null, this.endOfStream = !1, this.peekQueue = [], 
        !s.read || !s.once) {
          throw new Error("Expected an instance of stream.Readable");
        }
        this.s.once("end", () => this.reject(new EndOfFileStream_1.EndOfStreamError)), this.s.once("error", err => this.reject(err)), 
        this.s.once("close", () => this.reject(new Error("Stream closed")));
      }
      async peek(uint8Array, offset, length) {
        const bytesRead = await this.read(uint8Array, offset, length);
        return this.peekQueue.push(uint8Array.subarray(offset, offset + bytesRead)), bytesRead;
      }
      async read(buffer, offset, length) {
        if (0 === length) {
          return 0;
        }
        if (0 === this.peekQueue.length && this.endOfStream) {
          throw new EndOfFileStream_1.EndOfStreamError;
        }
        let remaining = length, bytesRead = 0;
        for (;this.peekQueue.length > 0 && remaining > 0; ) {
          const peekData = this.peekQueue.pop();
          if (!peekData) {
            throw new Error("peekData should be defined");
          }
          const lenCopy = Math.min(peekData.length, remaining);
          buffer.set(peekData.subarray(0, lenCopy), offset + bytesRead), bytesRead += lenCopy, 
          remaining -= lenCopy, lenCopy < peekData.length && this.peekQueue.push(peekData.subarray(lenCopy));
        }
        for (;remaining > 0 && !this.endOfStream; ) {
          const reqLen = Math.min(remaining, 1048576), chunkLen = await this.readFromStream(buffer, offset + bytesRead, reqLen);
          if (bytesRead += chunkLen, chunkLen < reqLen) {
            break;
          }
          remaining -= chunkLen;
        }
        return bytesRead;
      }
      async readFromStream(buffer, offset, length) {
        const readBuffer = this.s.read(length);
        if (readBuffer) {
          return buffer.set(readBuffer, offset), readBuffer.length;
        }
        {
          const request = {
            buffer: buffer,
            offset: offset,
            length: length,
            deferred: new Deferred_1.Deferred
          };
          return this.deferred = request.deferred, this.s.once("readable", () => {
            this.readDeferred(request);
          }), request.deferred.promise;
        }
      }
      readDeferred(request) {
        const readBuffer = this.s.read(request.length);
        readBuffer ? (request.buffer.set(readBuffer, request.offset), request.deferred.resolve(readBuffer.length), 
        this.deferred = null) : this.s.once("readable", () => {
          this.readDeferred(request);
        });
      }
      reject(err) {
        this.endOfStream = !0, this.deferred && (this.deferred.reject(err), this.deferred = null);
      }
    };
  }(StreamReader)), StreamReader;
}

function requireLib() {
  return hasRequiredLib || (hasRequiredLib = 1, function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.StreamReader = exports.EndOfStreamError = void 0;
    var EndOfFileStream_1 = requireEndOfFileStream();
    Object.defineProperty(exports, "EndOfStreamError", {
      enumerable: !0,
      get: function() {
        return EndOfFileStream_1.EndOfStreamError;
      }
    });
    var StreamReader_1 = requireStreamReader();
    Object.defineProperty(exports, "StreamReader", {
      enumerable: !0,
      get: function() {
        return StreamReader_1.StreamReader;
      }
    });
  }(lib)), lib;
}

function requireAbstractTokenizer() {
  if (hasRequiredAbstractTokenizer) {
    return AbstractTokenizer;
  }
  hasRequiredAbstractTokenizer = 1, Object.defineProperty(AbstractTokenizer, "__esModule", {
    value: !0
  }), AbstractTokenizer.AbstractTokenizer = void 0;
  const peek_readable_1 = requireLib();
  return AbstractTokenizer.AbstractTokenizer = class {
    constructor(fileInfo) {
      this.position = 0, this.numBuffer = new Uint8Array(8), this.fileInfo = fileInfo || {};
    }
    async readToken(token, position = this.position) {
      const uint8Array = Buffer.alloc(token.len);
      if (await this.readBuffer(uint8Array, {
        position: position
      }) < token.len) {
        throw new peek_readable_1.EndOfStreamError;
      }
      return token.get(uint8Array, 0);
    }
    async peekToken(token, position = this.position) {
      const uint8Array = Buffer.alloc(token.len);
      if (await this.peekBuffer(uint8Array, {
        position: position
      }) < token.len) {
        throw new peek_readable_1.EndOfStreamError;
      }
      return token.get(uint8Array, 0);
    }
    async readNumber(token) {
      if (await this.readBuffer(this.numBuffer, {
        length: token.len
      }) < token.len) {
        throw new peek_readable_1.EndOfStreamError;
      }
      return token.get(this.numBuffer, 0);
    }
    async peekNumber(token) {
      if (await this.peekBuffer(this.numBuffer, {
        length: token.len
      }) < token.len) {
        throw new peek_readable_1.EndOfStreamError;
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
    async close() {}
    normalizeOptions(uint8Array, options) {
      if (options && void 0 !== options.position && options.position < this.position) {
        throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
      }
      return options ? {
        mayBeLess: !0 === options.mayBeLess,
        offset: options.offset ? options.offset : 0,
        length: options.length ? options.length : uint8Array.length - (options.offset ? options.offset : 0),
        position: options.position ? options.position : this.position
      } : {
        mayBeLess: !1,
        offset: 0,
        length: uint8Array.length,
        position: this.position
      };
    }
  }, AbstractTokenizer;
}

function requireReadStreamTokenizer() {
  if (hasRequiredReadStreamTokenizer) {
    return ReadStreamTokenizer;
  }
  hasRequiredReadStreamTokenizer = 1, Object.defineProperty(ReadStreamTokenizer, "__esModule", {
    value: !0
  }), ReadStreamTokenizer.ReadStreamTokenizer = void 0;
  const AbstractTokenizer_1 = requireAbstractTokenizer(), peek_readable_1 = requireLib();
  let ReadStreamTokenizer$1 = class extends AbstractTokenizer_1.AbstractTokenizer {
    constructor(stream, fileInfo) {
      super(fileInfo), this.streamReader = new peek_readable_1.StreamReader(stream);
    }
    async getFileInfo() {
      return this.fileInfo;
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
      const bytesRead = await this.streamReader.read(uint8Array, normOptions.offset, normOptions.length);
      if (this.position += bytesRead, (!options || !options.mayBeLess) && bytesRead < normOptions.length) {
        throw new peek_readable_1.EndOfStreamError;
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
          }), uint8Array.set(skipBuffer.subarray(skipBytes), normOptions.offset), bytesRead - skipBytes;
        }
        if (skipBytes < 0) {
          throw new Error("Cannot peek from a negative offset in a stream");
        }
      }
      if (normOptions.length > 0) {
        try {
          bytesRead = await this.streamReader.peek(uint8Array, normOptions.offset, normOptions.length);
        } catch (err) {
          if (options && options.mayBeLess && err instanceof peek_readable_1.EndOfStreamError) {
            return 0;
          }
          throw err;
        }
        if (!normOptions.mayBeLess && bytesRead < normOptions.length) {
          throw new peek_readable_1.EndOfStreamError;
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
  };
  return ReadStreamTokenizer.ReadStreamTokenizer = ReadStreamTokenizer$1, ReadStreamTokenizer;
}

var BufferTokenizer = {}, hasRequiredBufferTokenizer, hasRequiredCore$1;

function requireBufferTokenizer() {
  if (hasRequiredBufferTokenizer) {
    return BufferTokenizer;
  }
  hasRequiredBufferTokenizer = 1, Object.defineProperty(BufferTokenizer, "__esModule", {
    value: !0
  }), BufferTokenizer.BufferTokenizer = void 0;
  const peek_readable_1 = requireLib(), AbstractTokenizer_1 = requireAbstractTokenizer();
  let BufferTokenizer$1 = class extends AbstractTokenizer_1.AbstractTokenizer {
    constructor(uint8Array, fileInfo) {
      super(fileInfo), this.uint8Array = uint8Array, this.fileInfo.size = this.fileInfo.size ? this.fileInfo.size : uint8Array.length;
    }
    async readBuffer(uint8Array, options) {
      if (options && options.position) {
        if (options.position < this.position) {
          throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
        }
        this.position = options.position;
      }
      const bytesRead = await this.peekBuffer(uint8Array, options);
      return this.position += bytesRead, bytesRead;
    }
    async peekBuffer(uint8Array, options) {
      const normOptions = this.normalizeOptions(uint8Array, options), bytes2read = Math.min(this.uint8Array.length - normOptions.position, normOptions.length);
      if (!normOptions.mayBeLess && bytes2read < normOptions.length) {
        throw new peek_readable_1.EndOfStreamError;
      }
      return uint8Array.set(this.uint8Array.subarray(normOptions.position, normOptions.position + bytes2read), normOptions.offset), 
      bytes2read;
    }
    async close() {}
  };
  return BufferTokenizer.BufferTokenizer = BufferTokenizer$1, BufferTokenizer;
}

function requireCore$1() {
  return hasRequiredCore$1 || (hasRequiredCore$1 = 1, function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.fromBuffer = exports.fromStream = exports.EndOfStreamError = void 0;
    const ReadStreamTokenizer_1 = requireReadStreamTokenizer(), BufferTokenizer_1 = requireBufferTokenizer();
    var peek_readable_1 = requireLib();
    Object.defineProperty(exports, "EndOfStreamError", {
      enumerable: !0,
      get: function() {
        return peek_readable_1.EndOfStreamError;
      }
    }), exports.fromStream = function(stream, fileInfo) {
      return fileInfo = fileInfo || {}, new ReadStreamTokenizer_1.ReadStreamTokenizer(stream, fileInfo);
    }, exports.fromBuffer = function(uint8Array, fileInfo) {
      return new BufferTokenizer_1.BufferTokenizer(uint8Array, fileInfo);
    };
  }(core$1)), core$1;
}

var util = {}, hasRequiredUtil, supported, hasRequiredSupported, core, hasRequiredCore;

function requireUtil() {
  return hasRequiredUtil || (hasRequiredUtil = 1, util.stringToBytes = string => [ ...string ].map(character => character.charCodeAt(0)), 
  util.tarHeaderChecksumMatches = (buffer, offset = 0) => {
    const readSum = parseInt(buffer.toString("utf8", 148, 154).replace(/\0.*$/, "").trim(), 8);
    if (isNaN(readSum)) {
      return !1;
    }
    let sum = 256;
    for (let i = offset; i < offset + 148; i++) {
      sum += buffer[i];
    }
    for (let i = offset + 156; i < offset + 512; i++) {
      sum += buffer[i];
    }
    return readSum === sum;
  }, util.uint32SyncSafeToken = {
    get: (buffer, offset) => 127 & buffer[offset + 3] | buffer[offset + 2] << 7 | buffer[offset + 1] << 14 | buffer[offset] << 21,
    len: 4
  }), util;
}

function requireSupported() {
  return hasRequiredSupported ? supported : (hasRequiredSupported = 1, supported = {
    extensions: [ "jpg", "png", "apng", "gif", "webp", "flif", "xcf", "cr2", "cr3", "orf", "arw", "dng", "nef", "rw2", "raf", "tif", "bmp", "icns", "jxr", "psd", "indd", "zip", "tar", "rar", "gz", "bz2", "7z", "dmg", "mp4", "mid", "mkv", "webm", "mov", "avi", "mpg", "mp2", "mp3", "m4a", "oga", "ogg", "ogv", "opus", "flac", "wav", "spx", "amr", "pdf", "epub", "exe", "swf", "rtf", "wasm", "woff", "woff2", "eot", "ttf", "otf", "ico", "flv", "ps", "xz", "sqlite", "nes", "crx", "xpi", "cab", "deb", "ar", "rpm", "Z", "lz", "cfb", "mxf", "mts", "blend", "bpg", "docx", "pptx", "xlsx", "3gp", "3g2", "jp2", "jpm", "jpx", "mj2", "aif", "qcp", "odt", "ods", "odp", "xml", "mobi", "heic", "cur", "ktx", "ape", "wv", "dcm", "ics", "glb", "pcap", "dsf", "lnk", "alias", "voc", "ac3", "m4v", "m4p", "m4b", "f4v", "f4p", "f4b", "f4a", "mie", "asf", "ogm", "ogx", "mpc", "arrow", "shp", "aac", "mp1", "it", "s3m", "xm", "ai", "skp", "avif", "eps", "lzh", "pgp", "asar", "stl", "chm", "3mf", "zst", "jxl", "vcf" ],
    mimeTypes: [ "image/jpeg", "image/png", "image/gif", "image/webp", "image/flif", "image/x-xcf", "image/x-canon-cr2", "image/x-canon-cr3", "image/tiff", "image/bmp", "image/vnd.ms-photo", "image/vnd.adobe.photoshop", "application/x-indesign", "application/epub+zip", "application/x-xpinstall", "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.presentation", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip", "application/x-tar", "application/x-rar-compressed", "application/gzip", "application/x-bzip2", "application/x-7z-compressed", "application/x-apple-diskimage", "application/x-apache-arrow", "video/mp4", "audio/midi", "video/x-matroska", "video/webm", "video/quicktime", "video/vnd.avi", "audio/vnd.wave", "audio/qcelp", "audio/x-ms-asf", "video/x-ms-asf", "application/vnd.ms-asf", "video/mpeg", "video/3gpp", "audio/mpeg", "audio/mp4", "audio/opus", "video/ogg", "audio/ogg", "application/ogg", "audio/x-flac", "audio/ape", "audio/wavpack", "audio/amr", "application/pdf", "application/x-msdownload", "application/x-shockwave-flash", "application/rtf", "application/wasm", "font/woff", "font/woff2", "application/vnd.ms-fontobject", "font/ttf", "font/otf", "image/x-icon", "video/x-flv", "application/postscript", "application/eps", "application/x-xz", "application/x-sqlite3", "application/x-nintendo-nes-rom", "application/x-google-chrome-extension", "application/vnd.ms-cab-compressed", "application/x-deb", "application/x-unix-archive", "application/x-rpm", "application/x-compress", "application/x-lzip", "application/x-cfb", "application/x-mie", "application/mxf", "video/mp2t", "application/x-blender", "image/bpg", "image/jp2", "image/jpx", "image/jpm", "image/mj2", "audio/aiff", "application/xml", "application/x-mobipocket-ebook", "image/heif", "image/heif-sequence", "image/heic", "image/heic-sequence", "image/icns", "image/ktx", "application/dicom", "audio/x-musepack", "text/calendar", "text/vcard", "model/gltf-binary", "application/vnd.tcpdump.pcap", "audio/x-dsf", "application/x.ms.shortcut", "application/x.apple.alias", "audio/x-voc", "audio/vnd.dolby.dd-raw", "audio/x-m4a", "image/apng", "image/x-olympus-orf", "image/x-sony-arw", "image/x-adobe-dng", "image/x-nikon-nef", "image/x-panasonic-rw2", "image/x-fujifilm-raf", "video/x-m4v", "video/3gpp2", "application/x-esri-shape", "audio/aac", "audio/x-it", "audio/x-s3m", "audio/x-xm", "video/MP1S", "video/MP2P", "application/vnd.sketchup.skp", "image/avif", "application/x-lzh-compressed", "application/pgp-encrypted", "application/x-asar", "model/stl", "application/vnd.ms-htmlhelp", "model/3mf", "image/jxl", "application/zstd" ]
  });
}

function requireCore() {
  if (hasRequiredCore) {
    return core;
  }
  hasRequiredCore = 1;
  const Token = requireLib$1(), strtok3 = requireCore$1(), {stringToBytes: stringToBytes, tarHeaderChecksumMatches: tarHeaderChecksumMatches, uint32SyncSafeToken: uint32SyncSafeToken} = requireUtil(), supported = requireSupported(), minimumBytes = 4100;
  async function fromStream(stream) {
    const tokenizer = await strtok3.fromStream(stream);
    try {
      return await fromTokenizer(tokenizer);
    } finally {
      await tokenizer.close();
    }
  }
  async function fromBuffer(input) {
    if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input))) {
      throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
    }
    const buffer = input instanceof Buffer ? input : Buffer.from(input);
    if (!(buffer && buffer.length > 1)) {
      return;
    }
    return fromTokenizer(strtok3.fromBuffer(buffer));
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
  async function fromTokenizer(tokenizer) {
    try {
      return _fromTokenizer(tokenizer);
    } catch (error) {
      if (!(error instanceof strtok3.EndOfStreamError)) {
        throw error;
      }
    }
  }
  async function _fromTokenizer(tokenizer) {
    let buffer = Buffer.alloc(minimumBytes);
    const check = (header, options) => _check(buffer, header, options), checkString = (header, options) => check(stringToBytes(header), options);
    if (tokenizer.fileInfo.size || (tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER), 
    await tokenizer.peekBuffer(buffer, {
      length: 12,
      mayBeLess: !0
    }), check([ 66, 77 ])) {
      return {
        ext: "bmp",
        mime: "image/bmp"
      };
    }
    if (check([ 11, 119 ])) {
      return {
        ext: "ac3",
        mime: "audio/vnd.dolby.dd-raw"
      };
    }
    if (check([ 120, 1 ])) {
      return {
        ext: "dmg",
        mime: "application/x-apple-diskimage"
      };
    }
    if (check([ 77, 90 ])) {
      return {
        ext: "exe",
        mime: "application/x-msdownload"
      };
    }
    if (check([ 37, 33 ])) {
      return await tokenizer.peekBuffer(buffer, {
        length: 24,
        mayBeLess: !0
      }), checkString("PS-Adobe-", {
        offset: 2
      }) && checkString(" EPSF-", {
        offset: 14
      }) ? {
        ext: "eps",
        mime: "application/eps"
      } : {
        ext: "ps",
        mime: "application/postscript"
      };
    }
    if (check([ 31, 160 ]) || check([ 31, 157 ])) {
      return {
        ext: "Z",
        mime: "application/x-compress"
      };
    }
    if (check([ 255, 216, 255 ])) {
      return {
        ext: "jpg",
        mime: "image/jpeg"
      };
    }
    if (check([ 73, 73, 188 ])) {
      return {
        ext: "jxr",
        mime: "image/vnd.ms-photo"
      };
    }
    if (check([ 31, 139, 8 ])) {
      return {
        ext: "gz",
        mime: "application/gzip"
      };
    }
    if (check([ 66, 90, 104 ])) {
      return {
        ext: "bz2",
        mime: "application/x-bzip2"
      };
    }
    if (checkString("ID3")) {
      await tokenizer.ignore(6);
      const id3HeaderLen = await tokenizer.readToken(uint32SyncSafeToken);
      return tokenizer.position + id3HeaderLen > tokenizer.fileInfo.size ? {
        ext: "mp3",
        mime: "audio/mpeg"
      } : (await tokenizer.ignore(id3HeaderLen), fromTokenizer(tokenizer));
    }
    if (checkString("MP+")) {
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    }
    if ((67 === buffer[0] || 70 === buffer[0]) && check([ 87, 83 ], {
      offset: 1
    })) {
      return {
        ext: "swf",
        mime: "application/x-shockwave-flash"
      };
    }
    if (check([ 71, 73, 70 ])) {
      return {
        ext: "gif",
        mime: "image/gif"
      };
    }
    if (checkString("FLIF")) {
      return {
        ext: "flif",
        mime: "image/flif"
      };
    }
    if (checkString("8BPS")) {
      return {
        ext: "psd",
        mime: "image/vnd.adobe.photoshop"
      };
    }
    if (checkString("WEBP", {
      offset: 8
    })) {
      return {
        ext: "webp",
        mime: "image/webp"
      };
    }
    if (checkString("MPCK")) {
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    }
    if (checkString("FORM")) {
      return {
        ext: "aif",
        mime: "audio/aiff"
      };
    }
    if (checkString("icns", {
      offset: 0
    })) {
      return {
        ext: "icns",
        mime: "image/icns"
      };
    }
    if (check([ 80, 75, 3, 4 ])) {
      try {
        for (;tokenizer.position + 30 < tokenizer.fileInfo.size; ) {
          await tokenizer.readBuffer(buffer, {
            length: 30
          });
          const zipHeader = {
            compressedSize: buffer.readUInt32LE(18),
            uncompressedSize: buffer.readUInt32LE(22),
            filenameLength: buffer.readUInt16LE(26),
            extraFieldLength: buffer.readUInt16LE(28)
          };
          if (zipHeader.filename = await tokenizer.readToken(new Token.StringType(zipHeader.filenameLength, "utf-8")), 
          await tokenizer.ignore(zipHeader.extraFieldLength), "META-INF/mozilla.rsa" === zipHeader.filename) {
            return {
              ext: "xpi",
              mime: "application/x-xpinstall"
            };
          }
          if (zipHeader.filename.endsWith(".rels") || zipHeader.filename.endsWith(".xml")) {
            switch (zipHeader.filename.split("/")[0]) {
             case "_rels":
             default:
              break;

             case "word":
              return {
                ext: "docx",
                mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              };

             case "ppt":
              return {
                ext: "pptx",
                mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
              };

             case "xl":
              return {
                ext: "xlsx",
                mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              };
            }
          }
          if (zipHeader.filename.startsWith("xl/")) {
            return {
              ext: "xlsx",
              mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };
          }
          if (zipHeader.filename.startsWith("3D/") && zipHeader.filename.endsWith(".model")) {
            return {
              ext: "3mf",
              mime: "model/3mf"
            };
          }
          if ("mimetype" === zipHeader.filename && zipHeader.compressedSize === zipHeader.uncompressedSize) {
            switch (await tokenizer.readToken(new Token.StringType(zipHeader.compressedSize, "utf-8"))) {
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

             case "application/vnd.oasis.opendocument.spreadsheet":
              return {
                ext: "ods",
                mime: "application/vnd.oasis.opendocument.spreadsheet"
              };

             case "application/vnd.oasis.opendocument.presentation":
              return {
                ext: "odp",
                mime: "application/vnd.oasis.opendocument.presentation"
              };
            }
          }
          if (0 === zipHeader.compressedSize) {
            let nextHeaderIndex = -1;
            for (;nextHeaderIndex < 0 && tokenizer.position < tokenizer.fileInfo.size; ) {
              await tokenizer.peekBuffer(buffer, {
                mayBeLess: !0
              }), nextHeaderIndex = buffer.indexOf("504B0304", 0, "hex"), await tokenizer.ignore(nextHeaderIndex >= 0 ? nextHeaderIndex : buffer.length);
            }
          } else {
            await tokenizer.ignore(zipHeader.compressedSize);
          }
        }
      } catch (error) {
        if (!(error instanceof strtok3.EndOfStreamError)) {
          throw error;
        }
      }
      return {
        ext: "zip",
        mime: "application/zip"
      };
    }
    if (checkString("OggS")) {
      await tokenizer.ignore(28);
      const type = Buffer.alloc(8);
      return await tokenizer.readBuffer(type), _check(type, [ 79, 112, 117, 115, 72, 101, 97, 100 ]) ? {
        ext: "opus",
        mime: "audio/opus"
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
    if (check([ 80, 75 ]) && (3 === buffer[2] || 5 === buffer[2] || 7 === buffer[2]) && (4 === buffer[3] || 6 === buffer[3] || 8 === buffer[3])) {
      return {
        ext: "zip",
        mime: "application/zip"
      };
    }
    if (checkString("ftyp", {
      offset: 4
    }) && 96 & buffer[8]) {
      const brandMajor = buffer.toString("binary", 8, 12).replace("\0", " ").trim();
      switch (brandMajor) {
       case "avif":
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
    if (checkString("MThd")) {
      return {
        ext: "mid",
        mime: "audio/midi"
      };
    }
    if (checkString("wOFF") && (check([ 0, 1, 0, 0 ], {
      offset: 4
    }) || checkString("OTTO", {
      offset: 4
    }))) {
      return {
        ext: "woff",
        mime: "font/woff"
      };
    }
    if (checkString("wOF2") && (check([ 0, 1, 0, 0 ], {
      offset: 4
    }) || checkString("OTTO", {
      offset: 4
    }))) {
      return {
        ext: "woff2",
        mime: "font/woff2"
      };
    }
    if (check([ 212, 195, 178, 161 ]) || check([ 161, 178, 195, 212 ])) {
      return {
        ext: "pcap",
        mime: "application/vnd.tcpdump.pcap"
      };
    }
    if (checkString("DSD ")) {
      return {
        ext: "dsf",
        mime: "audio/x-dsf"
      };
    }
    if (checkString("LZIP")) {
      return {
        ext: "lz",
        mime: "application/x-lzip"
      };
    }
    if (checkString("fLaC")) {
      return {
        ext: "flac",
        mime: "audio/x-flac"
      };
    }
    if (check([ 66, 80, 71, 251 ])) {
      return {
        ext: "bpg",
        mime: "image/bpg"
      };
    }
    if (checkString("wvpk")) {
      return {
        ext: "wv",
        mime: "audio/wavpack"
      };
    }
    if (checkString("%PDF")) {
      await tokenizer.ignore(1350);
      const maxBufferSize = 10485760, buffer = Buffer.alloc(Math.min(maxBufferSize, tokenizer.fileInfo.size));
      return await tokenizer.readBuffer(buffer, {
        mayBeLess: !0
      }), buffer.includes(Buffer.from("AIPrivateData")) ? {
        ext: "ai",
        mime: "application/postscript"
      } : {
        ext: "pdf",
        mime: "application/pdf"
      };
    }
    if (check([ 0, 97, 115, 109 ])) {
      return {
        ext: "wasm",
        mime: "application/wasm"
      };
    }
    if (check([ 73, 73, 42, 0 ])) {
      return checkString("CR", {
        offset: 8
      }) ? {
        ext: "cr2",
        mime: "image/x-canon-cr2"
      } : check([ 28, 0, 254, 0 ], {
        offset: 8
      }) || check([ 31, 0, 11, 0 ], {
        offset: 8
      }) ? {
        ext: "nef",
        mime: "image/x-nikon-nef"
      } : check([ 8, 0, 0, 0 ], {
        offset: 4
      }) && (check([ 45, 0, 254, 0 ], {
        offset: 8
      }) || check([ 39, 0, 254, 0 ], {
        offset: 8
      })) ? {
        ext: "dng",
        mime: "image/x-adobe-dng"
      } : (buffer = Buffer.alloc(24), await tokenizer.peekBuffer(buffer), (check([ 16, 251, 134, 1 ], {
        offset: 4
      }) || check([ 8, 0, 0, 0 ], {
        offset: 4
      })) && check([ 0, 254, 0, 4, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 1 ], {
        offset: 9
      }) ? {
        ext: "arw",
        mime: "image/x-sony-arw"
      } : {
        ext: "tif",
        mime: "image/tiff"
      });
    }
    if (check([ 77, 77, 0, 42 ])) {
      return {
        ext: "tif",
        mime: "image/tiff"
      };
    }
    if (checkString("MAC ")) {
      return {
        ext: "ape",
        mime: "audio/ape"
      };
    }
    if (check([ 26, 69, 223, 163 ])) {
      async function readField() {
        const msb = await tokenizer.peekNumber(Token.UINT8);
        let mask = 128, ic = 0;
        for (;0 === (msb & mask) && 0 !== mask; ) {
          ++ic, mask >>= 1;
        }
        const id = Buffer.alloc(ic + 1);
        return await tokenizer.readBuffer(id), id;
      }
      async function readElement() {
        const id = await readField(), lenField = await readField();
        lenField[0] ^= 128 >> lenField.length - 1;
        const nrLen = Math.min(6, lenField.length);
        return {
          id: id.readUIntBE(0, id.length),
          len: lenField.readUIntBE(lenField.length - nrLen, nrLen)
        };
      }
      async function readChildren(level, children) {
        for (;children > 0; ) {
          const e = await readElement();
          if (17026 === e.id) {
            return tokenizer.readToken(new Token.StringType(e.len, "utf-8"));
          }
          await tokenizer.ignore(e.len), --children;
        }
      }
      const re = await readElement();
      switch (await readChildren(0, re.len)) {
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
    if (check([ 82, 73, 70, 70 ])) {
      if (check([ 65, 86, 73 ], {
        offset: 8
      })) {
        return {
          ext: "avi",
          mime: "video/vnd.avi"
        };
      }
      if (check([ 87, 65, 86, 69 ], {
        offset: 8
      })) {
        return {
          ext: "wav",
          mime: "audio/vnd.wave"
        };
      }
      if (check([ 81, 76, 67, 77 ], {
        offset: 8
      })) {
        return {
          ext: "qcp",
          mime: "audio/qcelp"
        };
      }
    }
    if (checkString("SQLi")) {
      return {
        ext: "sqlite",
        mime: "application/x-sqlite3"
      };
    }
    if (check([ 78, 69, 83, 26 ])) {
      return {
        ext: "nes",
        mime: "application/x-nintendo-nes-rom"
      };
    }
    if (checkString("Cr24")) {
      return {
        ext: "crx",
        mime: "application/x-google-chrome-extension"
      };
    }
    if (checkString("MSCF") || checkString("ISc(")) {
      return {
        ext: "cab",
        mime: "application/vnd.ms-cab-compressed"
      };
    }
    if (check([ 237, 171, 238, 219 ])) {
      return {
        ext: "rpm",
        mime: "application/x-rpm"
      };
    }
    if (check([ 197, 208, 211, 198 ])) {
      return {
        ext: "eps",
        mime: "application/eps"
      };
    }
    if (check([ 40, 181, 47, 253 ])) {
      return {
        ext: "zst",
        mime: "application/zstd"
      };
    }
    if (check([ 79, 84, 84, 79, 0 ])) {
      return {
        ext: "otf",
        mime: "font/otf"
      };
    }
    if (checkString("#!AMR")) {
      return {
        ext: "amr",
        mime: "audio/amr"
      };
    }
    if (checkString("{\\rtf")) {
      return {
        ext: "rtf",
        mime: "application/rtf"
      };
    }
    if (check([ 70, 76, 86, 1 ])) {
      return {
        ext: "flv",
        mime: "video/x-flv"
      };
    }
    if (checkString("IMPM")) {
      return {
        ext: "it",
        mime: "audio/x-it"
      };
    }
    if (checkString("-lh0-", {
      offset: 2
    }) || checkString("-lh1-", {
      offset: 2
    }) || checkString("-lh2-", {
      offset: 2
    }) || checkString("-lh3-", {
      offset: 2
    }) || checkString("-lh4-", {
      offset: 2
    }) || checkString("-lh5-", {
      offset: 2
    }) || checkString("-lh6-", {
      offset: 2
    }) || checkString("-lh7-", {
      offset: 2
    }) || checkString("-lzs-", {
      offset: 2
    }) || checkString("-lz4-", {
      offset: 2
    }) || checkString("-lz5-", {
      offset: 2
    }) || checkString("-lhd-", {
      offset: 2
    })) {
      return {
        ext: "lzh",
        mime: "application/x-lzh-compressed"
      };
    }
    if (check([ 0, 0, 1, 186 ])) {
      if (check([ 33 ], {
        offset: 4,
        mask: [ 241 ]
      })) {
        return {
          ext: "mpg",
          mime: "video/MP1S"
        };
      }
      if (check([ 68 ], {
        offset: 4,
        mask: [ 196 ]
      })) {
        return {
          ext: "mpg",
          mime: "video/MP2P"
        };
      }
    }
    if (checkString("ITSF")) {
      return {
        ext: "chm",
        mime: "application/vnd.ms-htmlhelp"
      };
    }
    if (check([ 253, 55, 122, 88, 90, 0 ])) {
      return {
        ext: "xz",
        mime: "application/x-xz"
      };
    }
    if (checkString("<?xml ")) {
      return {
        ext: "xml",
        mime: "application/xml"
      };
    }
    if (check([ 55, 122, 188, 175, 39, 28 ])) {
      return {
        ext: "7z",
        mime: "application/x-7z-compressed"
      };
    }
    if (check([ 82, 97, 114, 33, 26, 7 ]) && (0 === buffer[6] || 1 === buffer[6])) {
      return {
        ext: "rar",
        mime: "application/x-rar-compressed"
      };
    }
    if (checkString("solid ")) {
      return {
        ext: "stl",
        mime: "model/stl"
      };
    }
    if (checkString("BLENDER")) {
      return {
        ext: "blend",
        mime: "application/x-blender"
      };
    }
    if (checkString("!<arch>")) {
      await tokenizer.ignore(8);
      return "debian-binary" === await tokenizer.readToken(new Token.StringType(13, "ascii")) ? {
        ext: "deb",
        mime: "application/x-deb"
      } : {
        ext: "ar",
        mime: "application/x-unix-archive"
      };
    }
    if (check([ 137, 80, 78, 71, 13, 10, 26, 10 ])) {
      async function readChunkHeader() {
        return {
          length: await tokenizer.readToken(Token.INT32_BE),
          type: await tokenizer.readToken(new Token.StringType(4, "binary"))
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
    if (check([ 65, 82, 82, 79, 87, 49, 0, 0 ])) {
      return {
        ext: "arrow",
        mime: "application/x-apache-arrow"
      };
    }
    if (check([ 103, 108, 84, 70, 2, 0, 0, 0 ])) {
      return {
        ext: "glb",
        mime: "model/gltf-binary"
      };
    }
    if (check([ 102, 114, 101, 101 ], {
      offset: 4
    }) || check([ 109, 100, 97, 116 ], {
      offset: 4
    }) || check([ 109, 111, 111, 118 ], {
      offset: 4
    }) || check([ 119, 105, 100, 101 ], {
      offset: 4
    })) {
      return {
        ext: "mov",
        mime: "video/quicktime"
      };
    }
    if (check([ 73, 73, 82, 79, 8, 0, 0, 0, 24 ])) {
      return {
        ext: "orf",
        mime: "image/x-olympus-orf"
      };
    }
    if (checkString("gimp xcf ")) {
      return {
        ext: "xcf",
        mime: "image/x-xcf"
      };
    }
    if (check([ 73, 73, 85, 0, 24, 0, 0, 0, 136, 231, 116, 216 ])) {
      return {
        ext: "rw2",
        mime: "image/x-panasonic-rw2"
      };
    }
    if (check([ 48, 38, 178, 117, 142, 102, 207, 17, 166, 217 ])) {
      async function readHeader() {
        const guid = Buffer.alloc(16);
        return await tokenizer.readBuffer(guid), {
          id: guid,
          size: Number(await tokenizer.readToken(Token.UINT64_LE))
        };
      }
      for (await tokenizer.ignore(30); tokenizer.position + 24 < tokenizer.fileInfo.size; ) {
        const header = await readHeader();
        let payload = header.size - 24;
        if (_check(header.id, [ 145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101 ])) {
          const typeId = Buffer.alloc(16);
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
    if (check([ 171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10 ])) {
      return {
        ext: "ktx",
        mime: "image/ktx"
      };
    }
    if ((check([ 126, 16, 4 ]) || check([ 126, 24, 4 ])) && check([ 48, 77, 73, 69 ], {
      offset: 4
    })) {
      return {
        ext: "mie",
        mime: "application/x-mie"
      };
    }
    if (check([ 39, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], {
      offset: 2
    })) {
      return {
        ext: "shp",
        mime: "application/x-esri-shape"
      };
    }
    if (check([ 0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10 ])) {
      await tokenizer.ignore(20);
      switch (await tokenizer.readToken(new Token.StringType(4, "ascii"))) {
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
    if (check([ 255, 10 ]) || check([ 0, 0, 0, 12, 74, 88, 76, 32, 13, 10, 135, 10 ])) {
      return {
        ext: "jxl",
        mime: "image/jxl"
      };
    }
    if (check([ 0, 0, 1, 186 ]) || check([ 0, 0, 1, 179 ])) {
      return {
        ext: "mpg",
        mime: "video/mpeg"
      };
    }
    if (check([ 0, 1, 0, 0, 0 ])) {
      return {
        ext: "ttf",
        mime: "font/ttf"
      };
    }
    if (check([ 0, 0, 1, 0 ])) {
      return {
        ext: "ico",
        mime: "image/x-icon"
      };
    }
    if (check([ 0, 0, 2, 0 ])) {
      return {
        ext: "cur",
        mime: "image/x-icon"
      };
    }
    if (check([ 208, 207, 17, 224, 161, 177, 26, 225 ])) {
      return {
        ext: "cfb",
        mime: "application/x-cfb"
      };
    }
    if (await tokenizer.peekBuffer(buffer, {
      length: Math.min(256, tokenizer.fileInfo.size),
      mayBeLess: !0
    }), checkString("BEGIN:")) {
      if (checkString("VCARD", {
        offset: 6
      })) {
        return {
          ext: "vcf",
          mime: "text/vcard"
        };
      }
      if (checkString("VCALENDAR", {
        offset: 6
      })) {
        return {
          ext: "ics",
          mime: "text/calendar"
        };
      }
    }
    if (checkString("FUJIFILMCCD-RAW")) {
      return {
        ext: "raf",
        mime: "image/x-fujifilm-raf"
      };
    }
    if (checkString("Extended Module:")) {
      return {
        ext: "xm",
        mime: "audio/x-xm"
      };
    }
    if (checkString("Creative Voice File")) {
      return {
        ext: "voc",
        mime: "audio/x-voc"
      };
    }
    if (check([ 4, 0, 0, 0 ]) && buffer.length >= 16) {
      const jsonSize = buffer.readUInt32LE(12);
      if (jsonSize > 12 && buffer.length >= jsonSize + 16) {
        try {
          const header = buffer.slice(16, jsonSize + 16).toString();
          if (JSON.parse(header).files) {
            return {
              ext: "asar",
              mime: "application/x-asar"
            };
          }
        } catch (_) {}
      }
    }
    if (check([ 6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2 ])) {
      return {
        ext: "mxf",
        mime: "application/mxf"
      };
    }
    if (checkString("SCRM", {
      offset: 44
    })) {
      return {
        ext: "s3m",
        mime: "audio/x-s3m"
      };
    }
    if (check([ 71 ], {
      offset: 4
    }) && (check([ 71 ], {
      offset: 192
    }) || check([ 71 ], {
      offset: 196
    }))) {
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    }
    if (check([ 66, 79, 79, 75, 77, 79, 66, 73 ], {
      offset: 60
    })) {
      return {
        ext: "mobi",
        mime: "application/x-mobipocket-ebook"
      };
    }
    if (check([ 68, 73, 67, 77 ], {
      offset: 128
    })) {
      return {
        ext: "dcm",
        mime: "application/dicom"
      };
    }
    if (check([ 76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70 ])) {
      return {
        ext: "lnk",
        mime: "application/x.ms.shortcut"
      };
    }
    if (check([ 98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0 ])) {
      return {
        ext: "alias",
        mime: "application/x.apple.alias"
      };
    }
    if (check([ 76, 80 ], {
      offset: 34
    }) && (check([ 0, 0, 1 ], {
      offset: 8
    }) || check([ 1, 0, 2 ], {
      offset: 8
    }) || check([ 2, 0, 2 ], {
      offset: 8
    }))) {
      return {
        ext: "eot",
        mime: "application/vnd.ms-fontobject"
      };
    }
    if (check([ 6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29 ])) {
      return {
        ext: "indd",
        mime: "application/x-indesign"
      };
    }
    if (await tokenizer.peekBuffer(buffer, {
      length: Math.min(512, tokenizer.fileInfo.size),
      mayBeLess: !0
    }), tarHeaderChecksumMatches(buffer)) {
      return {
        ext: "tar",
        mime: "application/x-tar"
      };
    }
    if (check([ 255, 254, 255, 14, 83, 0, 107, 0, 101, 0, 116, 0, 99, 0, 104, 0, 85, 0, 112, 0, 32, 0, 77, 0, 111, 0, 100, 0, 101, 0, 108, 0 ])) {
      return {
        ext: "skp",
        mime: "application/vnd.sketchup.skp"
      };
    }
    if (checkString("-----BEGIN PGP MESSAGE-----")) {
      return {
        ext: "pgp",
        mime: "application/pgp-encrypted"
      };
    }
    if (buffer.length >= 2 && check([ 255, 224 ], {
      offset: 0,
      mask: [ 255, 224 ]
    })) {
      if (check([ 16 ], {
        offset: 1,
        mask: [ 22 ]
      })) {
        return check([ 8 ], {
          offset: 1,
          mask: [ 8 ]
        }), {
          ext: "aac",
          mime: "audio/aac"
        };
      }
      if (check([ 2 ], {
        offset: 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      }
      if (check([ 4 ], {
        offset: 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      }
      if (check([ 6 ], {
        offset: 1,
        mask: [ 6 ]
      })) {
        return {
          ext: "mp1",
          mime: "audio/mpeg"
        };
      }
    }
  }
  const stream = readableStream => new Promise((resolve, reject) => {
    const stream = eval("require")("stream");
    readableStream.on("error", reject), readableStream.once("readable", async () => {
      const pass = new stream.PassThrough;
      let outputStream;
      outputStream = stream.pipeline ? stream.pipeline(readableStream, pass, () => {}) : readableStream.pipe(pass);
      const chunk = readableStream.read(minimumBytes) || readableStream.read() || Buffer.alloc(0);
      try {
        const fileType = await fromBuffer(chunk);
        pass.fileType = fileType;
      } catch (error) {
        reject(error);
      }
      resolve(outputStream);
    });
  }), fileType = {
    fromStream: fromStream,
    fromTokenizer: fromTokenizer,
    fromBuffer: fromBuffer,
    stream: stream
  };
  return Object.defineProperty(fileType, "extensions", {
    get: () => new Set(supported.extensions)
  }), Object.defineProperty(fileType, "mimeTypes", {
    get: () => new Set(supported.mimeTypes)
  }), core = fileType, core;
}

var coreExports = requireCore(), fileType = getDefaultExportFromCjs(coreExports);

function to(promise, errorExt) {
  return promise.then(function(data) {
    return [ null, data ];
  }).catch(function(err) {
    return [ err, void 0 ];
  });
}

const readFile = fs.promises.readFile, writeFile = fs.promises.writeFile;

var Mime_1, hasRequiredMime, standard, hasRequiredStandard, lite, hasRequiredLite;

function requireMime() {
  if (hasRequiredMime) {
    return Mime_1;
  }
  function Mime() {
    this._types = Object.create(null), this._extensions = Object.create(null);
    for (let i = 0; i < arguments.length; i++) {
      this.define(arguments[i]);
    }
    this.define = this.define.bind(this), this.getType = this.getType.bind(this), this.getExtension = this.getExtension.bind(this);
  }
  return hasRequiredMime = 1, Mime.prototype.define = function(typeMap, force) {
    for (let type in typeMap) {
      let extensions = typeMap[type].map(function(t) {
        return t.toLowerCase();
      });
      type = type.toLowerCase();
      for (let i = 0; i < extensions.length; i++) {
        const ext = extensions[i];
        if ("*" !== ext[0]) {
          if (!force && ext in this._types) {
            throw new Error('Attempt to change mapping for "' + ext + '" extension from "' + this._types[ext] + '" to "' + type + '". Pass `force=true` to allow this, otherwise remove "' + ext + '" from the list of extensions for "' + type + '".');
          }
          this._types[ext] = type;
        }
      }
      if (force || !this._extensions[type]) {
        const ext = extensions[0];
        this._extensions[type] = "*" !== ext[0] ? ext : ext.substr(1);
      }
    }
  }, Mime.prototype.getType = function(path) {
    let last = (path = String(path)).replace(/^.*[/\\]/, "").toLowerCase(), ext = last.replace(/^.*\./, "").toLowerCase(), hasPath = last.length < path.length;
    return (ext.length < last.length - 1 || !hasPath) && this._types[ext] || null;
  }, Mime.prototype.getExtension = function(type) {
    return (type = /^\s*([^;\s]*)/.test(type) && RegExp.$1) && this._extensions[type.toLowerCase()] || null;
  }, Mime_1 = Mime;
}

function requireStandard() {
  return hasRequiredStandard ? standard : (hasRequiredStandard = 1, standard = {
    "application/andrew-inset": [ "ez" ],
    "application/applixware": [ "aw" ],
    "application/atom+xml": [ "atom" ],
    "application/atomcat+xml": [ "atomcat" ],
    "application/atomdeleted+xml": [ "atomdeleted" ],
    "application/atomsvc+xml": [ "atomsvc" ],
    "application/atsc-dwd+xml": [ "dwd" ],
    "application/atsc-held+xml": [ "held" ],
    "application/atsc-rsat+xml": [ "rsat" ],
    "application/bdoc": [ "bdoc" ],
    "application/calendar+xml": [ "xcs" ],
    "application/ccxml+xml": [ "ccxml" ],
    "application/cdfx+xml": [ "cdfx" ],
    "application/cdmi-capability": [ "cdmia" ],
    "application/cdmi-container": [ "cdmic" ],
    "application/cdmi-domain": [ "cdmid" ],
    "application/cdmi-object": [ "cdmio" ],
    "application/cdmi-queue": [ "cdmiq" ],
    "application/cu-seeme": [ "cu" ],
    "application/dash+xml": [ "mpd" ],
    "application/davmount+xml": [ "davmount" ],
    "application/docbook+xml": [ "dbk" ],
    "application/dssc+der": [ "dssc" ],
    "application/dssc+xml": [ "xdssc" ],
    "application/ecmascript": [ "es", "ecma" ],
    "application/emma+xml": [ "emma" ],
    "application/emotionml+xml": [ "emotionml" ],
    "application/epub+zip": [ "epub" ],
    "application/exi": [ "exi" ],
    "application/express": [ "exp" ],
    "application/fdt+xml": [ "fdt" ],
    "application/font-tdpfr": [ "pfr" ],
    "application/geo+json": [ "geojson" ],
    "application/gml+xml": [ "gml" ],
    "application/gpx+xml": [ "gpx" ],
    "application/gxf": [ "gxf" ],
    "application/gzip": [ "gz" ],
    "application/hjson": [ "hjson" ],
    "application/hyperstudio": [ "stk" ],
    "application/inkml+xml": [ "ink", "inkml" ],
    "application/ipfix": [ "ipfix" ],
    "application/its+xml": [ "its" ],
    "application/java-archive": [ "jar", "war", "ear" ],
    "application/java-serialized-object": [ "ser" ],
    "application/java-vm": [ "class" ],
    "application/javascript": [ "js", "mjs" ],
    "application/json": [ "json", "map" ],
    "application/json5": [ "json5" ],
    "application/jsonml+json": [ "jsonml" ],
    "application/ld+json": [ "jsonld" ],
    "application/lgr+xml": [ "lgr" ],
    "application/lost+xml": [ "lostxml" ],
    "application/mac-binhex40": [ "hqx" ],
    "application/mac-compactpro": [ "cpt" ],
    "application/mads+xml": [ "mads" ],
    "application/manifest+json": [ "webmanifest" ],
    "application/marc": [ "mrc" ],
    "application/marcxml+xml": [ "mrcx" ],
    "application/mathematica": [ "ma", "nb", "mb" ],
    "application/mathml+xml": [ "mathml" ],
    "application/mbox": [ "mbox" ],
    "application/mediaservercontrol+xml": [ "mscml" ],
    "application/metalink+xml": [ "metalink" ],
    "application/metalink4+xml": [ "meta4" ],
    "application/mets+xml": [ "mets" ],
    "application/mmt-aei+xml": [ "maei" ],
    "application/mmt-usd+xml": [ "musd" ],
    "application/mods+xml": [ "mods" ],
    "application/mp21": [ "m21", "mp21" ],
    "application/mp4": [ "mp4s", "m4p" ],
    "application/msword": [ "doc", "dot" ],
    "application/mxf": [ "mxf" ],
    "application/n-quads": [ "nq" ],
    "application/n-triples": [ "nt" ],
    "application/node": [ "cjs" ],
    "application/octet-stream": [ "bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer" ],
    "application/oda": [ "oda" ],
    "application/oebps-package+xml": [ "opf" ],
    "application/ogg": [ "ogx" ],
    "application/omdoc+xml": [ "omdoc" ],
    "application/onenote": [ "onetoc", "onetoc2", "onetmp", "onepkg" ],
    "application/oxps": [ "oxps" ],
    "application/p2p-overlay+xml": [ "relo" ],
    "application/patch-ops-error+xml": [ "xer" ],
    "application/pdf": [ "pdf" ],
    "application/pgp-encrypted": [ "pgp" ],
    "application/pgp-signature": [ "asc", "sig" ],
    "application/pics-rules": [ "prf" ],
    "application/pkcs10": [ "p10" ],
    "application/pkcs7-mime": [ "p7m", "p7c" ],
    "application/pkcs7-signature": [ "p7s" ],
    "application/pkcs8": [ "p8" ],
    "application/pkix-attr-cert": [ "ac" ],
    "application/pkix-cert": [ "cer" ],
    "application/pkix-crl": [ "crl" ],
    "application/pkix-pkipath": [ "pkipath" ],
    "application/pkixcmp": [ "pki" ],
    "application/pls+xml": [ "pls" ],
    "application/postscript": [ "ai", "eps", "ps" ],
    "application/provenance+xml": [ "provx" ],
    "application/pskc+xml": [ "pskcxml" ],
    "application/raml+yaml": [ "raml" ],
    "application/rdf+xml": [ "rdf", "owl" ],
    "application/reginfo+xml": [ "rif" ],
    "application/relax-ng-compact-syntax": [ "rnc" ],
    "application/resource-lists+xml": [ "rl" ],
    "application/resource-lists-diff+xml": [ "rld" ],
    "application/rls-services+xml": [ "rs" ],
    "application/route-apd+xml": [ "rapd" ],
    "application/route-s-tsid+xml": [ "sls" ],
    "application/route-usd+xml": [ "rusd" ],
    "application/rpki-ghostbusters": [ "gbr" ],
    "application/rpki-manifest": [ "mft" ],
    "application/rpki-roa": [ "roa" ],
    "application/rsd+xml": [ "rsd" ],
    "application/rss+xml": [ "rss" ],
    "application/rtf": [ "rtf" ],
    "application/sbml+xml": [ "sbml" ],
    "application/scvp-cv-request": [ "scq" ],
    "application/scvp-cv-response": [ "scs" ],
    "application/scvp-vp-request": [ "spq" ],
    "application/scvp-vp-response": [ "spp" ],
    "application/sdp": [ "sdp" ],
    "application/senml+xml": [ "senmlx" ],
    "application/sensml+xml": [ "sensmlx" ],
    "application/set-payment-initiation": [ "setpay" ],
    "application/set-registration-initiation": [ "setreg" ],
    "application/shf+xml": [ "shf" ],
    "application/sieve": [ "siv", "sieve" ],
    "application/smil+xml": [ "smi", "smil" ],
    "application/sparql-query": [ "rq" ],
    "application/sparql-results+xml": [ "srx" ],
    "application/srgs": [ "gram" ],
    "application/srgs+xml": [ "grxml" ],
    "application/sru+xml": [ "sru" ],
    "application/ssdl+xml": [ "ssdl" ],
    "application/ssml+xml": [ "ssml" ],
    "application/swid+xml": [ "swidtag" ],
    "application/tei+xml": [ "tei", "teicorpus" ],
    "application/thraud+xml": [ "tfi" ],
    "application/timestamped-data": [ "tsd" ],
    "application/toml": [ "toml" ],
    "application/trig": [ "trig" ],
    "application/ttml+xml": [ "ttml" ],
    "application/ubjson": [ "ubj" ],
    "application/urc-ressheet+xml": [ "rsheet" ],
    "application/urc-targetdesc+xml": [ "td" ],
    "application/voicexml+xml": [ "vxml" ],
    "application/wasm": [ "wasm" ],
    "application/widget": [ "wgt" ],
    "application/winhlp": [ "hlp" ],
    "application/wsdl+xml": [ "wsdl" ],
    "application/wspolicy+xml": [ "wspolicy" ],
    "application/xaml+xml": [ "xaml" ],
    "application/xcap-att+xml": [ "xav" ],
    "application/xcap-caps+xml": [ "xca" ],
    "application/xcap-diff+xml": [ "xdf" ],
    "application/xcap-el+xml": [ "xel" ],
    "application/xcap-ns+xml": [ "xns" ],
    "application/xenc+xml": [ "xenc" ],
    "application/xhtml+xml": [ "xhtml", "xht" ],
    "application/xliff+xml": [ "xlf" ],
    "application/xml": [ "xml", "xsl", "xsd", "rng" ],
    "application/xml-dtd": [ "dtd" ],
    "application/xop+xml": [ "xop" ],
    "application/xproc+xml": [ "xpl" ],
    "application/xslt+xml": [ "*xsl", "xslt" ],
    "application/xspf+xml": [ "xspf" ],
    "application/xv+xml": [ "mxml", "xhvml", "xvml", "xvm" ],
    "application/yang": [ "yang" ],
    "application/yin+xml": [ "yin" ],
    "application/zip": [ "zip" ],
    "audio/3gpp": [ "*3gpp" ],
    "audio/adpcm": [ "adp" ],
    "audio/amr": [ "amr" ],
    "audio/basic": [ "au", "snd" ],
    "audio/midi": [ "mid", "midi", "kar", "rmi" ],
    "audio/mobile-xmf": [ "mxmf" ],
    "audio/mp3": [ "*mp3" ],
    "audio/mp4": [ "m4a", "mp4a" ],
    "audio/mpeg": [ "mpga", "mp2", "mp2a", "mp3", "m2a", "m3a" ],
    "audio/ogg": [ "oga", "ogg", "spx", "opus" ],
    "audio/s3m": [ "s3m" ],
    "audio/silk": [ "sil" ],
    "audio/wav": [ "wav" ],
    "audio/wave": [ "*wav" ],
    "audio/webm": [ "weba" ],
    "audio/xm": [ "xm" ],
    "font/collection": [ "ttc" ],
    "font/otf": [ "otf" ],
    "font/ttf": [ "ttf" ],
    "font/woff": [ "woff" ],
    "font/woff2": [ "woff2" ],
    "image/aces": [ "exr" ],
    "image/apng": [ "apng" ],
    "image/avif": [ "avif" ],
    "image/bmp": [ "bmp" ],
    "image/cgm": [ "cgm" ],
    "image/dicom-rle": [ "drle" ],
    "image/emf": [ "emf" ],
    "image/fits": [ "fits" ],
    "image/g3fax": [ "g3" ],
    "image/gif": [ "gif" ],
    "image/heic": [ "heic" ],
    "image/heic-sequence": [ "heics" ],
    "image/heif": [ "heif" ],
    "image/heif-sequence": [ "heifs" ],
    "image/hej2k": [ "hej2" ],
    "image/hsj2": [ "hsj2" ],
    "image/ief": [ "ief" ],
    "image/jls": [ "jls" ],
    "image/jp2": [ "jp2", "jpg2" ],
    "image/jpeg": [ "jpeg", "jpg", "jpe" ],
    "image/jph": [ "jph" ],
    "image/jphc": [ "jhc" ],
    "image/jpm": [ "jpm" ],
    "image/jpx": [ "jpx", "jpf" ],
    "image/jxr": [ "jxr" ],
    "image/jxra": [ "jxra" ],
    "image/jxrs": [ "jxrs" ],
    "image/jxs": [ "jxs" ],
    "image/jxsc": [ "jxsc" ],
    "image/jxsi": [ "jxsi" ],
    "image/jxss": [ "jxss" ],
    "image/ktx": [ "ktx" ],
    "image/ktx2": [ "ktx2" ],
    "image/png": [ "png" ],
    "image/sgi": [ "sgi" ],
    "image/svg+xml": [ "svg", "svgz" ],
    "image/t38": [ "t38" ],
    "image/tiff": [ "tif", "tiff" ],
    "image/tiff-fx": [ "tfx" ],
    "image/webp": [ "webp" ],
    "image/wmf": [ "wmf" ],
    "message/disposition-notification": [ "disposition-notification" ],
    "message/global": [ "u8msg" ],
    "message/global-delivery-status": [ "u8dsn" ],
    "message/global-disposition-notification": [ "u8mdn" ],
    "message/global-headers": [ "u8hdr" ],
    "message/rfc822": [ "eml", "mime" ],
    "model/3mf": [ "3mf" ],
    "model/gltf+json": [ "gltf" ],
    "model/gltf-binary": [ "glb" ],
    "model/iges": [ "igs", "iges" ],
    "model/mesh": [ "msh", "mesh", "silo" ],
    "model/mtl": [ "mtl" ],
    "model/obj": [ "obj" ],
    "model/step+xml": [ "stpx" ],
    "model/step+zip": [ "stpz" ],
    "model/step-xml+zip": [ "stpxz" ],
    "model/stl": [ "stl" ],
    "model/vrml": [ "wrl", "vrml" ],
    "model/x3d+binary": [ "*x3db", "x3dbz" ],
    "model/x3d+fastinfoset": [ "x3db" ],
    "model/x3d+vrml": [ "*x3dv", "x3dvz" ],
    "model/x3d+xml": [ "x3d", "x3dz" ],
    "model/x3d-vrml": [ "x3dv" ],
    "text/cache-manifest": [ "appcache", "manifest" ],
    "text/calendar": [ "ics", "ifb" ],
    "text/coffeescript": [ "coffee", "litcoffee" ],
    "text/css": [ "css" ],
    "text/csv": [ "csv" ],
    "text/html": [ "html", "htm", "shtml" ],
    "text/jade": [ "jade" ],
    "text/jsx": [ "jsx" ],
    "text/less": [ "less" ],
    "text/markdown": [ "markdown", "md" ],
    "text/mathml": [ "mml" ],
    "text/mdx": [ "mdx" ],
    "text/n3": [ "n3" ],
    "text/plain": [ "txt", "text", "conf", "def", "list", "log", "in", "ini" ],
    "text/richtext": [ "rtx" ],
    "text/rtf": [ "*rtf" ],
    "text/sgml": [ "sgml", "sgm" ],
    "text/shex": [ "shex" ],
    "text/slim": [ "slim", "slm" ],
    "text/spdx": [ "spdx" ],
    "text/stylus": [ "stylus", "styl" ],
    "text/tab-separated-values": [ "tsv" ],
    "text/troff": [ "t", "tr", "roff", "man", "me", "ms" ],
    "text/turtle": [ "ttl" ],
    "text/uri-list": [ "uri", "uris", "urls" ],
    "text/vcard": [ "vcard" ],
    "text/vtt": [ "vtt" ],
    "text/xml": [ "*xml" ],
    "text/yaml": [ "yaml", "yml" ],
    "video/3gpp": [ "3gp", "3gpp" ],
    "video/3gpp2": [ "3g2" ],
    "video/h261": [ "h261" ],
    "video/h263": [ "h263" ],
    "video/h264": [ "h264" ],
    "video/iso.segment": [ "m4s" ],
    "video/jpeg": [ "jpgv" ],
    "video/jpm": [ "*jpm", "jpgm" ],
    "video/mj2": [ "mj2", "mjp2" ],
    "video/mp2t": [ "ts" ],
    "video/mp4": [ "mp4", "mp4v", "mpg4" ],
    "video/mpeg": [ "mpeg", "mpg", "mpe", "m1v", "m2v" ],
    "video/ogg": [ "ogv" ],
    "video/quicktime": [ "qt", "mov" ],
    "video/webm": [ "webm" ]
  });
}

function requireLite() {
  if (hasRequiredLite) {
    return lite;
  }
  hasRequiredLite = 1;
  let Mime = requireMime();
  return lite = new Mime(requireStandard());
}

var liteExports = requireLite(), mime = getDefaultExportFromCjs(liteExports), HorizontalAlign, VerticalAlign, BlendMode;

function srcOver(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a;
  return {
    r: (src.r * src.a + dst.r * dst.a * (1 - src.a)) / a,
    g: (src.g * src.a + dst.g * dst.a * (1 - src.a)) / a,
    b: (src.b * src.a + dst.b * dst.a * (1 - src.a)) / a,
    a: a
  };
}

function dstOver(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a;
  return {
    r: (dst.r * dst.a + src.r * src.a * (1 - dst.a)) / a,
    g: (dst.g * dst.a + src.g * src.a * (1 - dst.a)) / a,
    b: (dst.b * dst.a + src.b * src.a * (1 - dst.a)) / a,
    a: a
  };
}

function multiply(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (sra * dra + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
    g: (sga * dga + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
    b: (sba * dba + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
    a: a
  };
}

function add(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a;
  return {
    r: (sra + dst.r * dst.a) / a,
    g: (sga + dst.g * dst.a) / a,
    b: (sba + dst.b * dst.a) / a,
    a: a
  };
}

function screen(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (sra * dst.a + dra * src.a - sra * dra + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
    g: (sga * dst.a + dga * src.a - sga * dga + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
    b: (sba * dst.a + dba * src.a - sba * dba + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
    a: a
  };
}

function overlay(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (2 * dra <= dst.a ? 2 * sra * dra + sra * (1 - dst.a) + dra * (1 - src.a) : sra * (1 + dst.a) + dra * (1 + src.a) - 2 * dra * sra - dst.a * src.a) / a,
    g: (2 * dga <= dst.a ? 2 * sga * dga + sga * (1 - dst.a) + dga * (1 - src.a) : sga * (1 + dst.a) + dga * (1 + src.a) - 2 * dga * sga - dst.a * src.a) / a,
    b: (2 * dba <= dst.a ? 2 * sba * dba + sba * (1 - dst.a) + dba * (1 - src.a) : sba * (1 + dst.a) + dba * (1 + src.a) - 2 * dba * sba - dst.a * src.a) / a,
    a: a
  };
}

function darken(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (Math.min(sra * dst.a, dra * src.a) + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
    g: (Math.min(sga * dst.a, dga * src.a) + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
    b: (Math.min(sba * dst.a, dba * src.a) + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
    a: a
  };
}

function lighten(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (Math.max(sra * dst.a, dra * src.a) + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
    g: (Math.max(sga * dst.a, dga * src.a) + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
    b: (Math.max(sba * dst.a, dba * src.a) + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
    a: a
  };
}

function hardLight(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (2 * sra <= src.a ? 2 * sra * dra + sra * (1 - dst.a) + dra * (1 - src.a) : sra * (1 + dst.a) + dra * (1 + src.a) - 2 * dra * sra - dst.a * src.a) / a,
    g: (2 * sga <= src.a ? 2 * sga * dga + sga * (1 - dst.a) + dga * (1 - src.a) : sga * (1 + dst.a) + dga * (1 + src.a) - 2 * dga * sga - dst.a * src.a) / a,
    b: (2 * sba <= src.a ? 2 * sba * dba + sba * (1 - dst.a) + dba * (1 - src.a) : sba * (1 + dst.a) + dba * (1 + src.a) - 2 * dba * sba - dst.a * src.a) / a,
    a: a
  };
}

function difference(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (sra + dra - 2 * Math.min(sra * dst.a, dra * src.a)) / a,
    g: (sga + dga - 2 * Math.min(sga * dst.a, dga * src.a)) / a,
    b: (sba + dba - 2 * Math.min(sba * dst.a, dba * src.a)) / a,
    a: a
  };
}

function exclusion(src, dst, ops = 1) {
  src.a *= ops;
  const a = dst.a + src.a - dst.a * src.a, sra = src.r * src.a, sga = src.g * src.a, sba = src.b * src.a, dra = dst.r * dst.a, dga = dst.g * dst.a, dba = dst.b * dst.a;
  return {
    r: (sra * dst.a + dra * src.a - 2 * sra * dra + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
    g: (sga * dst.a + dga * src.a - 2 * sga * dga + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
    b: (sba * dst.a + dba * src.a - 2 * sba * dba + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
    a: a
  };
}

!function(HorizontalAlign) {
  HorizontalAlign[HorizontalAlign.LEFT = 1] = "LEFT", HorizontalAlign[HorizontalAlign.CENTER = 2] = "CENTER", 
  HorizontalAlign[HorizontalAlign.RIGHT = 4] = "RIGHT";
}(HorizontalAlign || (HorizontalAlign = {})), function(VerticalAlign) {
  VerticalAlign[VerticalAlign.TOP = 8] = "TOP", VerticalAlign[VerticalAlign.MIDDLE = 16] = "MIDDLE", 
  VerticalAlign[VerticalAlign.BOTTOM = 32] = "BOTTOM";
}(VerticalAlign || (VerticalAlign = {})), function(BlendMode) {
  BlendMode.SRC_OVER = "srcOver", BlendMode.DST_OVER = "dstOver", BlendMode.MULTIPLY = "multiply", 
  BlendMode.ADD = "add", BlendMode.SCREEN = "screen", BlendMode.OVERLAY = "overlay", 
  BlendMode.DARKEN = "darken", BlendMode.LIGHTEN = "lighten", BlendMode.HARD_LIGHT = "hardLight", 
  BlendMode.DIFFERENCE = "difference", BlendMode.EXCLUSION = "exclusion";
}(BlendMode || (BlendMode = {}));

const names = [ srcOver, dstOver, multiply, add, screen, overlay, darken, lighten, hardLight, difference, exclusion ];

var compositeModes = Object.freeze({
  __proto__: null,
  add: add,
  darken: darken,
  difference: difference,
  dstOver: dstOver,
  exclusion: exclusion,
  hardLight: hardLight,
  lighten: lighten,
  multiply: multiply,
  names: names,
  overlay: overlay,
  screen: screen,
  srcOver: srcOver
}), jpeg$1, hasRequiredJpeg, exif, hasRequiredExif, date, hasRequiredDate, simplify, hasRequiredSimplify, exifTags, hasRequiredExifTags, parser, hasRequiredParser, domBufferstream, hasRequiredDomBufferstream, bufferstream, hasRequiredBufferstream, exifParser, hasRequiredExifParser;

function composite(baseImage, src, x = 0, y = 0, options = {}) {
  if (!(src instanceof baseImage.constructor)) {
    throw new Error("The source must be a Jimp image");
  }
  if ("number" != typeof x || "number" != typeof y) {
    throw new Error("x and y must be numbers");
  }
  const {mode: mode = BlendMode.SRC_OVER} = options;
  let {opacitySource: opacitySource = 1, opacityDest: opacityDest = 1} = options;
  ("number" != typeof opacitySource || opacitySource < 0 || opacitySource > 1) && (opacitySource = 1), 
  ("number" != typeof opacityDest || opacityDest < 0 || opacityDest > 1) && (opacityDest = 1);
  const blendmode = compositeModes[mode];
  return x = Math.round(x), y = Math.round(y), 1 !== opacityDest && baseImage.scan((_, __, idx) => {
    const v = baseImage.bitmap.data[idx + 3] * opacityDest;
    baseImage.bitmap.data[idx + 3] = v;
  }), src.scan((sx, sy, idx) => {
    const dstIdx = baseImage.getPixelIndex(x + sx, y + sy, Edge.CROP);
    if (-1 === dstIdx) {
      return;
    }
    const blended = blendmode({
      r: src.bitmap.data[idx + 0] / 255,
      g: src.bitmap.data[idx + 1] / 255,
      b: src.bitmap.data[idx + 2] / 255,
      a: src.bitmap.data[idx + 3] / 255
    }, {
      r: baseImage.bitmap.data[dstIdx + 0] / 255,
      g: baseImage.bitmap.data[dstIdx + 1] / 255,
      b: baseImage.bitmap.data[dstIdx + 2] / 255,
      a: baseImage.bitmap.data[dstIdx + 3] / 255
    }, opacitySource);
    baseImage.bitmap.data[dstIdx + 0] = limit255(255 * blended.r), baseImage.bitmap.data[dstIdx + 1] = limit255(255 * blended.g), 
    baseImage.bitmap.data[dstIdx + 2] = limit255(255 * blended.b), baseImage.bitmap.data[dstIdx + 3] = limit255(255 * blended.a);
  }), baseImage;
}

function requireJpeg() {
  return hasRequiredJpeg ? jpeg$1 : (hasRequiredJpeg = 1, jpeg$1 = {
    parseSections: function(stream, iterator) {
      var len, markerType;
      for (stream.setBigEndian(!0); stream.remainingLength() > 0 && 218 !== markerType; ) {
        if (255 !== stream.nextUInt8()) {
          throw new Error("Invalid JPEG section offset");
        }
        len = (markerType = stream.nextUInt8()) >= 208 && markerType <= 217 || 218 === markerType ? 0 : stream.nextUInt16() - 2, 
        iterator(markerType, stream.branch(0, len)), stream.skip(len);
      }
    },
    getSizeFromSOFSection: function(stream) {
      return stream.skip(1), {
        height: stream.nextUInt16(),
        width: stream.nextUInt16()
      };
    },
    getSectionName: function(markerType) {
      var name, index;
      switch (markerType) {
       case 216:
        name = "SOI";
        break;

       case 196:
        name = "DHT";
        break;

       case 219:
        name = "DQT";
        break;

       case 221:
        name = "DRI";
        break;

       case 218:
        name = "SOS";
        break;

       case 254:
        name = "COM";
        break;

       case 217:
        name = "EOI";
        break;

       default:
        markerType >= 224 && markerType <= 239 ? (name = "APP", index = markerType - 224) : markerType >= 192 && markerType <= 207 && 196 !== markerType && 200 !== markerType && 204 !== markerType ? (name = "SOF", 
        index = markerType - 192) : markerType >= 208 && markerType <= 215 && (name = "RST", 
        index = markerType - 208);
      }
      var nameStruct = {
        name: name
      };
      return "number" == typeof index && (nameStruct.index = index), nameStruct;
    }
  });
}

function requireExif() {
  if (hasRequiredExif) {
    return exif;
  }
  function readExifValue(format, stream) {
    switch (format) {
     case 1:
      return stream.nextUInt8();

     case 3:
     case 8:
      return stream.nextUInt16();

     case 4:
     case 9:
      return stream.nextUInt32();

     case 5:
      return [ stream.nextUInt32(), stream.nextUInt32() ];

     case 6:
      return stream.nextInt8();

     case 10:
      return [ stream.nextInt32(), stream.nextInt32() ];

     case 11:
      return stream.nextFloat();

     case 12:
      return stream.nextDouble();

     default:
      throw new Error("Invalid format while decoding: " + format);
    }
  }
  function readExifTag(tiffMarker, stream) {
    var values, c, tagType = stream.nextUInt16(), format = stream.nextUInt16(), bytesPerComponent = function(format) {
      switch (format) {
       case 1:
       case 2:
       case 6:
       case 7:
        return 1;

       case 3:
       case 8:
        return 2;

       case 4:
       case 9:
       case 11:
        return 4;

       case 5:
       case 10:
       case 12:
        return 8;

       default:
        return 0;
      }
    }(format), components = stream.nextUInt32(), valueBytes = bytesPerComponent * components;
    if (valueBytes > 4 && (stream = tiffMarker.openWithOffset(stream.nextUInt32())), 
    2 === format) {
      var lastNull = (values = stream.nextString(components)).indexOf("\0");
      -1 !== lastNull && (values = values.substr(0, lastNull));
    } else if (7 === format) {
      values = stream.nextBuffer(components);
    } else if (0 !== format) {
      for (values = [], c = 0; c < components; ++c) {
        values.push(readExifValue(format, stream));
      }
    }
    return valueBytes < 4 && stream.skip(4 - valueBytes), [ tagType, values, format ];
  }
  function readIFDSection(tiffMarker, stream, iterator) {
    var tag, i, numberOfEntries = stream.nextUInt16();
    for (i = 0; i < numberOfEntries; ++i) {
      iterator((tag = readExifTag(tiffMarker, stream))[0], tag[1], tag[2]);
    }
  }
  return hasRequiredExif = 1, exif = {
    IFD0: 1,
    IFD1: 2,
    GPSIFD: 3,
    SubIFD: 4,
    InteropIFD: 5,
    parseTags: function(stream, iterator) {
      var tiffMarker, subIfdOffset, gpsOffset, interopOffset;
      try {
        tiffMarker = function(stream) {
          if ("Exif\0\0" !== stream.nextString(6)) {
            throw new Error("Invalid EXIF header");
          }
          var tiffMarker = stream.mark(), tiffHeader = stream.nextUInt16();
          if (18761 === tiffHeader) {
            stream.setBigEndian(!1);
          } else {
            if (19789 !== tiffHeader) {
              throw new Error("Invalid TIFF header");
            }
            stream.setBigEndian(!0);
          }
          if (42 !== stream.nextUInt16()) {
            throw new Error("Invalid TIFF data");
          }
          return tiffMarker;
        }(stream);
      } catch (e) {
        return !1;
      }
      var ifd0Stream = tiffMarker.openWithOffset(stream.nextUInt32()), IFD0 = this.IFD0;
      readIFDSection(tiffMarker, ifd0Stream, function(tagType, value, format) {
        switch (tagType) {
         case 34853:
          gpsOffset = value[0];
          break;

         case 34665:
          subIfdOffset = value[0];
          break;

         default:
          iterator(IFD0, tagType, value, format);
        }
      });
      var ifd1Offset = ifd0Stream.nextUInt32();
      if (0 !== ifd1Offset) {
        var ifd1Stream = tiffMarker.openWithOffset(ifd1Offset);
        readIFDSection(tiffMarker, ifd1Stream, iterator.bind(null, this.IFD1));
      }
      if (gpsOffset) {
        var gpsStream = tiffMarker.openWithOffset(gpsOffset);
        readIFDSection(tiffMarker, gpsStream, iterator.bind(null, this.GPSIFD));
      }
      if (subIfdOffset) {
        var subIfdStream = tiffMarker.openWithOffset(subIfdOffset), InteropIFD = this.InteropIFD;
        readIFDSection(tiffMarker, subIfdStream, function(tagType, value, format) {
          40965 === tagType ? interopOffset = value[0] : iterator(InteropIFD, tagType, value, format);
        });
      }
      if (interopOffset) {
        var interopStream = tiffMarker.openWithOffset(interopOffset);
        readIFDSection(tiffMarker, interopStream, iterator.bind(null, this.InteropIFD));
      }
      return !0;
    }
  };
}

function requireDate() {
  if (hasRequiredDate) {
    return date;
  }
  function parseNumber(s) {
    return parseInt(s, 10);
  }
  hasRequiredDate = 1;
  function parseDateTimeParts(dateParts, timeParts) {
    dateParts = dateParts.map(parseNumber), timeParts = timeParts.map(parseNumber);
    var year = dateParts[0], month = dateParts[1] - 1, day = dateParts[2], hours = timeParts[0], minutes = timeParts[1], seconds = timeParts[2];
    return Date.UTC(year, month, day, hours, minutes, seconds, 0) / 1e3;
  }
  function parseDateWithTimezoneFormat(dateTimeStr) {
    var dateParts = dateTimeStr.substr(0, 10).split("-"), timeParts = dateTimeStr.substr(11, 8).split(":"), timezoneParts = dateTimeStr.substr(19, 6).split(":").map(parseNumber), timezoneOffset = 3600 * timezoneParts[0] + 60 * timezoneParts[1], timestamp = parseDateTimeParts(dateParts, timeParts);
    if ("number" == typeof (timestamp -= timezoneOffset) && !isNaN(timestamp)) {
      return timestamp;
    }
  }
  function parseDateWithSpecFormat(dateTimeStr) {
    var parts = dateTimeStr.split(" "), timestamp = parseDateTimeParts(parts[0].split(":"), parts[1].split(":"));
    if ("number" == typeof timestamp && !isNaN(timestamp)) {
      return timestamp;
    }
  }
  return date = {
    parseDateWithSpecFormat: parseDateWithSpecFormat,
    parseDateWithTimezoneFormat: parseDateWithTimezoneFormat,
    parseExifDate: function(dateTimeStr) {
      var isSpecFormat = 19 === dateTimeStr.length && ":" === dateTimeStr.charAt(4);
      return 25 === dateTimeStr.length && "T" === dateTimeStr.charAt(10) ? parseDateWithTimezoneFormat(dateTimeStr) : isSpecFormat ? parseDateWithSpecFormat(dateTimeStr) : void 0;
    }
  };
}

function requireSimplify() {
  if (hasRequiredSimplify) {
    return simplify;
  }
  hasRequiredSimplify = 1;
  var exif = requireExif(), date = requireDate(), degreeTags = [ {
    section: exif.GPSIFD,
    type: 2,
    name: "GPSLatitude",
    refType: 1,
    refName: "GPSLatitudeRef",
    posVal: "N"
  }, {
    section: exif.GPSIFD,
    type: 4,
    name: "GPSLongitude",
    refType: 3,
    refName: "GPSLongitudeRef",
    posVal: "E"
  } ], dateTags = [ {
    section: exif.SubIFD,
    type: 306,
    name: "ModifyDate"
  }, {
    section: exif.SubIFD,
    type: 36867,
    name: "DateTimeOriginal"
  }, {
    section: exif.SubIFD,
    type: 36868,
    name: "CreateDate"
  }, {
    section: exif.SubIFD,
    type: 306,
    name: "ModifyDate"
  } ];
  return simplify = {
    castDegreeValues: function(getTagValue, setTagValue) {
      degreeTags.forEach(function(t) {
        var degreeVal = getTagValue(t);
        if (degreeVal) {
          var degreeNumRef = getTagValue({
            section: t.section,
            type: t.refType,
            name: t.refName
          }) === t.posVal ? 1 : -1, degree = (degreeVal[0] + degreeVal[1] / 60 + degreeVal[2] / 3600) * degreeNumRef;
          setTagValue(t, degree);
        }
      });
    },
    castDateValues: function(getTagValue, setTagValue) {
      dateTags.forEach(function(t) {
        var dateStrVal = getTagValue(t);
        if (dateStrVal) {
          var timestamp = date.parseExifDate(dateStrVal);
          void 0 !== timestamp && setTagValue(t, timestamp);
        }
      });
    },
    simplifyValue: function(values, format) {
      return Array.isArray(values) && 1 === (values = values.map(function(value) {
        return 10 === format || 5 === format ? value[0] / value[1] : value;
      })).length && (values = values[0]), values;
    }
  };
}

function requireExifTags() {
  return hasRequiredExifTags ? exifTags : (hasRequiredExifTags = 1, exifTags = {
    exif: {
      1: "InteropIndex",
      2: "InteropVersion",
      11: "ProcessingSoftware",
      254: "SubfileType",
      255: "OldSubfileType",
      256: "ImageWidth",
      257: "ImageHeight",
      258: "BitsPerSample",
      259: "Compression",
      262: "PhotometricInterpretation",
      263: "Thresholding",
      264: "CellWidth",
      265: "CellLength",
      266: "FillOrder",
      269: "DocumentName",
      270: "ImageDescription",
      271: "Make",
      272: "Model",
      273: "StripOffsets",
      274: "Orientation",
      277: "SamplesPerPixel",
      278: "RowsPerStrip",
      279: "StripByteCounts",
      280: "MinSampleValue",
      281: "MaxSampleValue",
      282: "XResolution",
      283: "YResolution",
      284: "PlanarConfiguration",
      285: "PageName",
      286: "XPosition",
      287: "YPosition",
      288: "FreeOffsets",
      289: "FreeByteCounts",
      290: "GrayResponseUnit",
      291: "GrayResponseCurve",
      292: "T4Options",
      293: "T6Options",
      296: "ResolutionUnit",
      297: "PageNumber",
      300: "ColorResponseUnit",
      301: "TransferFunction",
      305: "Software",
      306: "ModifyDate",
      315: "Artist",
      316: "HostComputer",
      317: "Predictor",
      318: "WhitePoint",
      319: "PrimaryChromaticities",
      320: "ColorMap",
      321: "HalftoneHints",
      322: "TileWidth",
      323: "TileLength",
      324: "TileOffsets",
      325: "TileByteCounts",
      326: "BadFaxLines",
      327: "CleanFaxData",
      328: "ConsecutiveBadFaxLines",
      330: "SubIFD",
      332: "InkSet",
      333: "InkNames",
      334: "NumberofInks",
      336: "DotRange",
      337: "TargetPrinter",
      338: "ExtraSamples",
      339: "SampleFormat",
      340: "SMinSampleValue",
      341: "SMaxSampleValue",
      342: "TransferRange",
      343: "ClipPath",
      344: "XClipPathUnits",
      345: "YClipPathUnits",
      346: "Indexed",
      347: "JPEGTables",
      351: "OPIProxy",
      400: "GlobalParametersIFD",
      401: "ProfileType",
      402: "FaxProfile",
      403: "CodingMethods",
      404: "VersionYear",
      405: "ModeNumber",
      433: "Decode",
      434: "DefaultImageColor",
      435: "T82Options",
      437: "JPEGTables",
      512: "JPEGProc",
      513: "ThumbnailOffset",
      514: "ThumbnailLength",
      515: "JPEGRestartInterval",
      517: "JPEGLosslessPredictors",
      518: "JPEGPointTransforms",
      519: "JPEGQTables",
      520: "JPEGDCTables",
      521: "JPEGACTables",
      529: "YCbCrCoefficients",
      530: "YCbCrSubSampling",
      531: "YCbCrPositioning",
      532: "ReferenceBlackWhite",
      559: "StripRowCounts",
      700: "ApplicationNotes",
      999: "USPTOMiscellaneous",
      4096: "RelatedImageFileFormat",
      4097: "RelatedImageWidth",
      4098: "RelatedImageHeight",
      18246: "Rating",
      18247: "XP_DIP_XML",
      18248: "StitchInfo",
      18249: "RatingPercent",
      32781: "ImageID",
      32931: "WangTag1",
      32932: "WangAnnotation",
      32933: "WangTag3",
      32934: "WangTag4",
      32995: "Matteing",
      32996: "DataType",
      32997: "ImageDepth",
      32998: "TileDepth",
      33405: "Model2",
      33421: "CFARepeatPatternDim",
      33422: "CFAPattern2",
      33423: "BatteryLevel",
      33424: "KodakIFD",
      33432: "Copyright",
      33434: "ExposureTime",
      33437: "FNumber",
      33445: "MDFileTag",
      33446: "MDScalePixel",
      33447: "MDColorTable",
      33448: "MDLabName",
      33449: "MDSampleInfo",
      33450: "MDPrepDate",
      33451: "MDPrepTime",
      33452: "MDFileUnits",
      33550: "PixelScale",
      33589: "AdventScale",
      33590: "AdventRevision",
      33628: "UIC1Tag",
      33629: "UIC2Tag",
      33630: "UIC3Tag",
      33631: "UIC4Tag",
      33723: "IPTC-NAA",
      33918: "IntergraphPacketData",
      33919: "IntergraphFlagRegisters",
      33920: "IntergraphMatrix",
      33921: "INGRReserved",
      33922: "ModelTiePoint",
      34016: "Site",
      34017: "ColorSequence",
      34018: "IT8Header",
      34019: "RasterPadding",
      34020: "BitsPerRunLength",
      34021: "BitsPerExtendedRunLength",
      34022: "ColorTable",
      34023: "ImageColorIndicator",
      34024: "BackgroundColorIndicator",
      34025: "ImageColorValue",
      34026: "BackgroundColorValue",
      34027: "PixelIntensityRange",
      34028: "TransparencyIndicator",
      34029: "ColorCharacterization",
      34030: "HCUsage",
      34031: "TrapIndicator",
      34032: "CMYKEquivalent",
      34118: "SEMInfo",
      34152: "AFCP_IPTC",
      34232: "PixelMagicJBIGOptions",
      34264: "ModelTransform",
      34306: "WB_GRGBLevels",
      34310: "LeafData",
      34377: "PhotoshopSettings",
      34665: "ExifOffset",
      34675: "ICC_Profile",
      34687: "TIFF_FXExtensions",
      34688: "MultiProfiles",
      34689: "SharedData",
      34690: "T88Options",
      34732: "ImageLayer",
      34735: "GeoTiffDirectory",
      34736: "GeoTiffDoubleParams",
      34737: "GeoTiffAsciiParams",
      34850: "ExposureProgram",
      34852: "SpectralSensitivity",
      34853: "GPSInfo",
      34855: "ISO",
      34856: "Opto-ElectricConvFactor",
      34857: "Interlace",
      34858: "TimeZoneOffset",
      34859: "SelfTimerMode",
      34864: "SensitivityType",
      34865: "StandardOutputSensitivity",
      34866: "RecommendedExposureIndex",
      34867: "ISOSpeed",
      34868: "ISOSpeedLatitudeyyy",
      34869: "ISOSpeedLatitudezzz",
      34908: "FaxRecvParams",
      34909: "FaxSubAddress",
      34910: "FaxRecvTime",
      34954: "LeafSubIFD",
      36864: "ExifVersion",
      36867: "DateTimeOriginal",
      36868: "CreateDate",
      37121: "ComponentsConfiguration",
      37122: "CompressedBitsPerPixel",
      37377: "ShutterSpeedValue",
      37378: "ApertureValue",
      37379: "BrightnessValue",
      37380: "ExposureCompensation",
      37381: "MaxApertureValue",
      37382: "SubjectDistance",
      37383: "MeteringMode",
      37384: "LightSource",
      37385: "Flash",
      37386: "FocalLength",
      37387: "FlashEnergy",
      37388: "SpatialFrequencyResponse",
      37389: "Noise",
      37390: "FocalPlaneXResolution",
      37391: "FocalPlaneYResolution",
      37392: "FocalPlaneResolutionUnit",
      37393: "ImageNumber",
      37394: "SecurityClassification",
      37395: "ImageHistory",
      37396: "SubjectArea",
      37397: "ExposureIndex",
      37398: "TIFF-EPStandardID",
      37399: "SensingMethod",
      37434: "CIP3DataFile",
      37435: "CIP3Sheet",
      37436: "CIP3Side",
      37439: "StoNits",
      37500: "MakerNote",
      37510: "UserComment",
      37520: "SubSecTime",
      37521: "SubSecTimeOriginal",
      37522: "SubSecTimeDigitized",
      37679: "MSDocumentText",
      37680: "MSPropertySetStorage",
      37681: "MSDocumentTextPosition",
      37724: "ImageSourceData",
      40091: "XPTitle",
      40092: "XPComment",
      40093: "XPAuthor",
      40094: "XPKeywords",
      40095: "XPSubject",
      40960: "FlashpixVersion",
      40961: "ColorSpace",
      40962: "ExifImageWidth",
      40963: "ExifImageHeight",
      40964: "RelatedSoundFile",
      40965: "InteropOffset",
      41483: "FlashEnergy",
      41484: "SpatialFrequencyResponse",
      41485: "Noise",
      41486: "FocalPlaneXResolution",
      41487: "FocalPlaneYResolution",
      41488: "FocalPlaneResolutionUnit",
      41489: "ImageNumber",
      41490: "SecurityClassification",
      41491: "ImageHistory",
      41492: "SubjectLocation",
      41493: "ExposureIndex",
      41494: "TIFF-EPStandardID",
      41495: "SensingMethod",
      41728: "FileSource",
      41729: "SceneType",
      41730: "CFAPattern",
      41985: "CustomRendered",
      41986: "ExposureMode",
      41987: "WhiteBalance",
      41988: "DigitalZoomRatio",
      41989: "FocalLengthIn35mmFormat",
      41990: "SceneCaptureType",
      41991: "GainControl",
      41992: "Contrast",
      41993: "Saturation",
      41994: "Sharpness",
      41995: "DeviceSettingDescription",
      41996: "SubjectDistanceRange",
      42016: "ImageUniqueID",
      42032: "OwnerName",
      42033: "SerialNumber",
      42034: "LensInfo",
      42035: "LensMake",
      42036: "LensModel",
      42037: "LensSerialNumber",
      42112: "GDALMetadata",
      42113: "GDALNoData",
      42240: "Gamma",
      44992: "ExpandSoftware",
      44993: "ExpandLens",
      44994: "ExpandFilm",
      44995: "ExpandFilterLens",
      44996: "ExpandScanner",
      44997: "ExpandFlashLamp",
      48129: "PixelFormat",
      48130: "Transformation",
      48131: "Uncompressed",
      48132: "ImageType",
      48256: "ImageWidth",
      48257: "ImageHeight",
      48258: "WidthResolution",
      48259: "HeightResolution",
      48320: "ImageOffset",
      48321: "ImageByteCount",
      48322: "AlphaOffset",
      48323: "AlphaByteCount",
      48324: "ImageDataDiscard",
      48325: "AlphaDataDiscard",
      50215: "OceScanjobDesc",
      50216: "OceApplicationSelector",
      50217: "OceIDNumber",
      50218: "OceImageLogic",
      50255: "Annotations",
      50341: "PrintIM",
      50560: "USPTOOriginalContentType",
      50706: "DNGVersion",
      50707: "DNGBackwardVersion",
      50708: "UniqueCameraModel",
      50709: "LocalizedCameraModel",
      50710: "CFAPlaneColor",
      50711: "CFALayout",
      50712: "LinearizationTable",
      50713: "BlackLevelRepeatDim",
      50714: "BlackLevel",
      50715: "BlackLevelDeltaH",
      50716: "BlackLevelDeltaV",
      50717: "WhiteLevel",
      50718: "DefaultScale",
      50719: "DefaultCropOrigin",
      50720: "DefaultCropSize",
      50721: "ColorMatrix1",
      50722: "ColorMatrix2",
      50723: "CameraCalibration1",
      50724: "CameraCalibration2",
      50725: "ReductionMatrix1",
      50726: "ReductionMatrix2",
      50727: "AnalogBalance",
      50728: "AsShotNeutral",
      50729: "AsShotWhiteXY",
      50730: "BaselineExposure",
      50731: "BaselineNoise",
      50732: "BaselineSharpness",
      50733: "BayerGreenSplit",
      50734: "LinearResponseLimit",
      50735: "CameraSerialNumber",
      50736: "DNGLensInfo",
      50737: "ChromaBlurRadius",
      50738: "AntiAliasStrength",
      50739: "ShadowScale",
      50740: "DNGPrivateData",
      50741: "MakerNoteSafety",
      50752: "RawImageSegmentation",
      50778: "CalibrationIlluminant1",
      50779: "CalibrationIlluminant2",
      50780: "BestQualityScale",
      50781: "RawDataUniqueID",
      50784: "AliasLayerMetadata",
      50827: "OriginalRawFileName",
      50828: "OriginalRawFileData",
      50829: "ActiveArea",
      50830: "MaskedAreas",
      50831: "AsShotICCProfile",
      50832: "AsShotPreProfileMatrix",
      50833: "CurrentICCProfile",
      50834: "CurrentPreProfileMatrix",
      50879: "ColorimetricReference",
      50898: "PanasonicTitle",
      50899: "PanasonicTitle2",
      50931: "CameraCalibrationSig",
      50932: "ProfileCalibrationSig",
      50933: "ProfileIFD",
      50934: "AsShotProfileName",
      50935: "NoiseReductionApplied",
      50936: "ProfileName",
      50937: "ProfileHueSatMapDims",
      50938: "ProfileHueSatMapData1",
      50939: "ProfileHueSatMapData2",
      50940: "ProfileToneCurve",
      50941: "ProfileEmbedPolicy",
      50942: "ProfileCopyright",
      50964: "ForwardMatrix1",
      50965: "ForwardMatrix2",
      50966: "PreviewApplicationName",
      50967: "PreviewApplicationVersion",
      50968: "PreviewSettingsName",
      50969: "PreviewSettingsDigest",
      50970: "PreviewColorSpace",
      50971: "PreviewDateTime",
      50972: "RawImageDigest",
      50973: "OriginalRawFileDigest",
      50974: "SubTileBlockSize",
      50975: "RowInterleaveFactor",
      50981: "ProfileLookTableDims",
      50982: "ProfileLookTableData",
      51008: "OpcodeList1",
      51009: "OpcodeList2",
      51022: "OpcodeList3",
      51041: "NoiseProfile",
      51043: "TimeCodes",
      51044: "FrameRate",
      51058: "TStop",
      51081: "ReelName",
      51089: "OriginalDefaultFinalSize",
      51090: "OriginalBestQualitySize",
      51091: "OriginalDefaultCropSize",
      51105: "CameraLabel",
      51107: "ProfileHueSatMapEncoding",
      51108: "ProfileLookTableEncoding",
      51109: "BaselineExposureOffset",
      51110: "DefaultBlackRender",
      51111: "NewRawImageDigest",
      51112: "RawToPreviewGain",
      51125: "DefaultUserCrop",
      59932: "Padding",
      59933: "OffsetSchema",
      65e3: "OwnerName",
      65001: "SerialNumber",
      65002: "Lens",
      65024: "KDC_IFD",
      65100: "RawFile",
      65101: "Converter",
      65102: "WhiteBalance",
      65105: "Exposure",
      65106: "Shadows",
      65107: "Brightness",
      65108: "Contrast",
      65109: "Saturation",
      65110: "Sharpness",
      65111: "Smoothness",
      65112: "MoireFilter"
    },
    gps: {
      0: "GPSVersionID",
      1: "GPSLatitudeRef",
      2: "GPSLatitude",
      3: "GPSLongitudeRef",
      4: "GPSLongitude",
      5: "GPSAltitudeRef",
      6: "GPSAltitude",
      7: "GPSTimeStamp",
      8: "GPSSatellites",
      9: "GPSStatus",
      10: "GPSMeasureMode",
      11: "GPSDOP",
      12: "GPSSpeedRef",
      13: "GPSSpeed",
      14: "GPSTrackRef",
      15: "GPSTrack",
      16: "GPSImgDirectionRef",
      17: "GPSImgDirection",
      18: "GPSMapDatum",
      19: "GPSDestLatitudeRef",
      20: "GPSDestLatitude",
      21: "GPSDestLongitudeRef",
      22: "GPSDestLongitude",
      23: "GPSDestBearingRef",
      24: "GPSDestBearing",
      25: "GPSDestDistanceRef",
      26: "GPSDestDistance",
      27: "GPSProcessingMethod",
      28: "GPSAreaInformation",
      29: "GPSDateStamp",
      30: "GPSDifferential",
      31: "GPSHPositioningError"
    }
  });
}

function requireParser() {
  if (hasRequiredParser) {
    return parser;
  }
  hasRequiredParser = 1;
  var jpeg = requireJpeg(), exif = requireExif(), simplify = requireSimplify();
  function ExifResult(startMarker, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset) {
    this.startMarker = startMarker, this.tags = tags, this.imageSize = imageSize, this.thumbnailOffset = thumbnailOffset, 
    this.thumbnailLength = thumbnailLength, this.thumbnailType = thumbnailType, this.app1Offset = app1Offset;
  }
  function Parser(stream) {
    this.stream = stream, this.flags = {
      readBinaryTags: !1,
      resolveTagNames: !0,
      simplifyValues: !0,
      imageSize: !0,
      hidePointers: !0,
      returnTags: !0
    };
  }
  return ExifResult.prototype = {
    hasThumbnail: function(mime) {
      return !(!this.thumbnailOffset || !this.thumbnailLength) && ("string" != typeof mime || ("image/jpeg" === mime.toLowerCase().trim() ? 6 === this.thumbnailType : "image/tiff" === mime.toLowerCase().trim() && 1 === this.thumbnailType));
    },
    getThumbnailOffset: function() {
      return this.app1Offset + 6 + this.thumbnailOffset;
    },
    getThumbnailLength: function() {
      return this.thumbnailLength;
    },
    getThumbnailBuffer: function() {
      return this._getThumbnailStream().nextBuffer(this.thumbnailLength);
    },
    _getThumbnailStream: function() {
      return this.startMarker.openWithOffset(this.getThumbnailOffset());
    },
    getImageSize: function() {
      return this.imageSize;
    },
    getThumbnailSize: function() {
      var size, stream = this._getThumbnailStream();
      return jpeg.parseSections(stream, function(sectionType, sectionStream) {
        "SOF" === jpeg.getSectionName(sectionType).name && (size = jpeg.getSizeFromSOFSection(sectionStream));
      }), size;
    }
  }, Parser.prototype = {
    enableBinaryFields: function(enable) {
      return this.flags.readBinaryTags = !!enable, this;
    },
    enablePointers: function(enable) {
      return this.flags.hidePointers = !enable, this;
    },
    enableTagNames: function(enable) {
      return this.flags.resolveTagNames = !!enable, this;
    },
    enableImageSize: function(enable) {
      return this.flags.imageSize = !!enable, this;
    },
    enableReturnTags: function(enable) {
      return this.flags.returnTags = !!enable, this;
    },
    enableSimpleValues: function(enable) {
      return this.flags.simplifyValues = !!enable, this;
    },
    parse: function() {
      var tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset, tagNames, getTagValue, setTagValue, start = this.stream.mark(), stream = start.openWithOffset(0), flags = this.flags;
      return flags.resolveTagNames && (tagNames = requireExifTags()), flags.resolveTagNames ? (tags = {}, 
      getTagValue = function(t) {
        return tags[t.name];
      }, setTagValue = function(t, value) {
        tags[t.name] = value;
      }) : (tags = [], getTagValue = function(t) {
        var i;
        for (i = 0; i < tags.length; ++i) {
          if (tags[i].type === t.type && tags[i].section === t.section) {
            return tags.value;
          }
        }
      }, setTagValue = function(t, value) {
        var i;
        for (i = 0; i < tags.length; ++i) {
          if (tags[i].type === t.type && tags[i].section === t.section) {
            return void (tags.value = value);
          }
        }
      }), jpeg.parseSections(stream, function(sectionType, sectionStream) {
        var sectionOffset = sectionStream.offsetFrom(start);
        225 === sectionType ? exif.parseTags(sectionStream, function(ifdSection, tagType, value, format) {
          if (flags.readBinaryTags || 7 !== format) {
            if (513 === tagType) {
              if (thumbnailOffset = value[0], flags.hidePointers) {
                return;
              }
            } else if (514 === tagType) {
              if (thumbnailLength = value[0], flags.hidePointers) {
                return;
              }
            } else if (259 === tagType && (thumbnailType = value[0], flags.hidePointers)) {
              return;
            }
            if (flags.returnTags) {
              if (flags.simplifyValues && (value = simplify.simplifyValue(value, format)), flags.resolveTagNames) {
                var name = (ifdSection === exif.GPSIFD ? tagNames.gps : tagNames.exif)[tagType];
                name || (name = tagNames.exif[tagType]), tags.hasOwnProperty(name) || (tags[name] = value);
              } else {
                tags.push({
                  section: ifdSection,
                  type: tagType,
                  value: value
                });
              }
            }
          }
        }) && (app1Offset = sectionOffset) : flags.imageSize && "SOF" === jpeg.getSectionName(sectionType).name && (imageSize = jpeg.getSizeFromSOFSection(sectionStream));
      }), flags.simplifyValues && (simplify.castDegreeValues(getTagValue, setTagValue), 
      simplify.castDateValues(getTagValue, setTagValue)), new ExifResult(start, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset);
    }
  }, parser = Parser;
}

function requireDomBufferstream() {
  if (hasRequiredDomBufferstream) {
    return domBufferstream;
  }
  function DOMBufferStream(arrayBuffer, offset, length, bigEndian, global, parentOffset) {
    this.global = global, offset = offset || 0, length = length || arrayBuffer.byteLength - offset, 
    this.arrayBuffer = arrayBuffer.slice(offset, offset + length), this.view = new global.DataView(this.arrayBuffer, 0, this.arrayBuffer.byteLength), 
    this.setBigEndian(bigEndian), this.offset = 0, this.parentOffset = (parentOffset || 0) + offset;
  }
  return hasRequiredDomBufferstream = 1, DOMBufferStream.prototype = {
    setBigEndian: function(bigEndian) {
      this.littleEndian = !bigEndian;
    },
    nextUInt8: function() {
      var value = this.view.getUint8(this.offset);
      return this.offset += 1, value;
    },
    nextInt8: function() {
      var value = this.view.getInt8(this.offset);
      return this.offset += 1, value;
    },
    nextUInt16: function() {
      var value = this.view.getUint16(this.offset, this.littleEndian);
      return this.offset += 2, value;
    },
    nextUInt32: function() {
      var value = this.view.getUint32(this.offset, this.littleEndian);
      return this.offset += 4, value;
    },
    nextInt16: function() {
      var value = this.view.getInt16(this.offset, this.littleEndian);
      return this.offset += 2, value;
    },
    nextInt32: function() {
      var value = this.view.getInt32(this.offset, this.littleEndian);
      return this.offset += 4, value;
    },
    nextFloat: function() {
      var value = this.view.getFloat32(this.offset, this.littleEndian);
      return this.offset += 4, value;
    },
    nextDouble: function() {
      var value = this.view.getFloat64(this.offset, this.littleEndian);
      return this.offset += 8, value;
    },
    nextBuffer: function(length) {
      var value = this.arrayBuffer.slice(this.offset, this.offset + length);
      return this.offset += length, value;
    },
    remainingLength: function() {
      return this.arrayBuffer.byteLength - this.offset;
    },
    nextString: function(length) {
      var value = this.arrayBuffer.slice(this.offset, this.offset + length);
      return value = String.fromCharCode.apply(null, new this.global.Uint8Array(value)), 
      this.offset += length, value;
    },
    mark: function() {
      var self = this;
      return {
        openWithOffset: function(offset) {
          return offset = (offset || 0) + this.offset, new DOMBufferStream(self.arrayBuffer, offset, self.arrayBuffer.byteLength - offset, !self.littleEndian, self.global, self.parentOffset);
        },
        offset: this.offset,
        getParentOffset: function() {
          return self.parentOffset;
        }
      };
    },
    offsetFrom: function(marker) {
      return this.parentOffset + this.offset - (marker.offset + marker.getParentOffset());
    },
    skip: function(amount) {
      this.offset += amount;
    },
    branch: function(offset, length) {
      return length = "number" == typeof length ? length : this.arrayBuffer.byteLength - (this.offset + offset), 
      new DOMBufferStream(this.arrayBuffer, this.offset + offset, length, !this.littleEndian, this.global, this.parentOffset);
    }
  }, domBufferstream = DOMBufferStream;
}

function requireBufferstream() {
  if (hasRequiredBufferstream) {
    return bufferstream;
  }
  function BufferStream(buffer, offset, length, bigEndian) {
    this.buffer = buffer, this.offset = offset || 0, length = "number" == typeof length ? length : buffer.length, 
    this.endPosition = this.offset + length, this.setBigEndian(bigEndian);
  }
  return hasRequiredBufferstream = 1, BufferStream.prototype = {
    setBigEndian: function(bigEndian) {
      this.bigEndian = !!bigEndian;
    },
    nextUInt8: function() {
      var value = this.buffer.readUInt8(this.offset);
      return this.offset += 1, value;
    },
    nextInt8: function() {
      var value = this.buffer.readInt8(this.offset);
      return this.offset += 1, value;
    },
    nextUInt16: function() {
      var value = this.bigEndian ? this.buffer.readUInt16BE(this.offset) : this.buffer.readUInt16LE(this.offset);
      return this.offset += 2, value;
    },
    nextUInt32: function() {
      var value = this.bigEndian ? this.buffer.readUInt32BE(this.offset) : this.buffer.readUInt32LE(this.offset);
      return this.offset += 4, value;
    },
    nextInt16: function() {
      var value = this.bigEndian ? this.buffer.readInt16BE(this.offset) : this.buffer.readInt16LE(this.offset);
      return this.offset += 2, value;
    },
    nextInt32: function() {
      var value = this.bigEndian ? this.buffer.readInt32BE(this.offset) : this.buffer.readInt32LE(this.offset);
      return this.offset += 4, value;
    },
    nextFloat: function() {
      var value = this.bigEndian ? this.buffer.readFloatBE(this.offset) : this.buffer.readFloatLE(this.offset);
      return this.offset += 4, value;
    },
    nextDouble: function() {
      var value = this.bigEndian ? this.buffer.readDoubleBE(this.offset) : this.buffer.readDoubleLE(this.offset);
      return this.offset += 8, value;
    },
    nextBuffer: function(length) {
      var value = this.buffer.slice(this.offset, this.offset + length);
      return this.offset += length, value;
    },
    remainingLength: function() {
      return this.endPosition - this.offset;
    },
    nextString: function(length) {
      var value = this.buffer.toString("utf8", this.offset, this.offset + length);
      return this.offset += length, value;
    },
    mark: function() {
      var self = this;
      return {
        openWithOffset: function(offset) {
          return offset = (offset || 0) + this.offset, new BufferStream(self.buffer, offset, self.endPosition - offset, self.bigEndian);
        },
        offset: this.offset
      };
    },
    offsetFrom: function(marker) {
      return this.offset - marker.offset;
    },
    skip: function(amount) {
      this.offset += amount;
    },
    branch: function(offset, length) {
      return length = "number" == typeof length ? length : this.endPosition - (this.offset + offset), 
      new BufferStream(this.buffer, this.offset + offset, length, this.bigEndian);
    }
  }, bufferstream = BufferStream;
}

function requireExifParser() {
  if (hasRequiredExifParser) {
    return exifParser;
  }
  hasRequiredExifParser = 1;
  var Parser = requireParser();
  return exifParser = {
    create: function(buffer, global) {
      if (buffer instanceof (global = global || (0, eval)("this")).ArrayBuffer) {
        var DOMBufferStream = requireDomBufferstream();
        return new Parser(new DOMBufferStream(buffer, 0, buffer.byteLength, !0, global));
      }
      var NodeBufferStream = requireBufferstream();
      return new Parser(new NodeBufferStream(buffer, 0, buffer.length, !0));
    }
  };
}

var exifParserExports = requireExifParser(), EXIFParser = getDefaultExportFromCjs(exifParserExports);

function getExifOrientation(img) {
  const _exif = img._exif;
  return _exif && _exif.tags && _exif.tags.Orientation || 1;
}

function getExifOrientationTransformation(img) {
  const w = img.bitmap.width, h = img.bitmap.height;
  switch (getExifOrientation(img)) {
   case 1:
   default:
    return null;

   case 2:
    return function(x, y) {
      return [ w - x - 1, y ];
    };

   case 3:
    return function(x, y) {
      return [ w - x - 1, h - y - 1 ];
    };

   case 4:
    return function(x, y) {
      return [ x, h - y - 1 ];
    };

   case 5:
    return function(x, y) {
      return [ y, x ];
    };

   case 6:
    return function(x, y) {
      return [ y, h - x - 1 ];
    };

   case 7:
    return function(x, y) {
      return [ w - y - 1, h - x - 1 ];
    };

   case 8:
    return function(x, y) {
      return [ w - y - 1, x ];
    };
  }
}

function transformBitmap(img, width, height, transformation) {
  const _data = img.bitmap.data, _width = img.bitmap.width, data = Buffer.alloc(_data.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const [_x, _y] = transformation(x, y), idx = width * y + x << 2, _idx = _width * _y + _x << 2, pixel = _data.readUInt32BE(_idx);
      data.writeUInt32BE(pixel, idx);
    }
  }
  img.bitmap.data = data, img.bitmap.width = width, img.bitmap.height = height, img._exif.tags.Orientation = 1;
}

function exifRotate(img) {
  if (getExifOrientation(img) < 2) {
    return;
  }
  const transformation = getExifOrientationTransformation(img), swapDimensions = getExifOrientation(img) > 4, newWidth = swapDimensions ? img.bitmap.height : img.bitmap.width, newHeight = swapDimensions ? img.bitmap.width : img.bitmap.height;
  transformation && transformBitmap(img, newWidth, newHeight, transformation);
}

async function attemptExifRotate(image, buffer) {
  try {
    image._exif = EXIFParser.create(buffer).parse(), exifRotate(image);
  } catch {}
}

const emptyBitmap = {
  data: Buffer.alloc(0),
  width: 0,
  height: 0
};

function bufferFromArrayBuffer(arrayBuffer) {
  const buffer = Buffer.alloc(arrayBuffer.byteLength), view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

function createJimp({plugins: pluginsArg, formats: formatsArg} = {}) {
  const plugins = pluginsArg || [], formats = (formatsArg || []).map(format => format()), CustomJimp = class {
    bitmap=emptyBitmap;
    background=0;
    formats=[];
    mime;
    constructor(options = emptyBitmap) {
      if (this.formats = formats, "data" in options) {
        this.bitmap = options;
      } else if (this.bitmap = {
        data: Buffer.alloc(options.width * options.height * 4),
        width: options.width,
        height: options.height
      }, options.color) {
        this.background = "string" == typeof options.color ? cssColorToHex(options.color) : options.color;
        for (let i = 0; i < this.bitmap.data.length; i += 4) {
          this.bitmap.data.writeUInt32BE(this.background, i);
        }
      }
      for (const methods of plugins) {
        for (const key in methods) {
          this[key] = (...args) => {
            const result = methods[key]?.(this, ...args);
            return "object" == typeof result && "bitmap" in result ? (this.bitmap = result.bitmap, 
            this) : result;
          };
        }
      }
    }
    static async read(url, options) {
      if (Buffer.isBuffer(url) || url instanceof ArrayBuffer) {
        return this.fromBuffer(url);
      }
      if (fs.existsSync(url)) {
        return this.fromBuffer(await readFile(url));
      }
      const [fetchErr, response] = await to(fetch(url));
      if (fetchErr) {
        throw new Error(`Could not load Buffer from URL: ${url}`);
      }
      if (!response.ok) {
        throw new Error(`HTTP Status ${response.status} for url ${url}`);
      }
      const [arrayBufferErr, data] = await to(response.arrayBuffer());
      if (arrayBufferErr) {
        throw new Error(`Could not load Buffer from ${url}`);
      }
      const buffer = bufferFromArrayBuffer(data);
      return this.fromBuffer(buffer, options);
    }
    static fromBitmap(bitmap) {
      let data;
      if (bitmap.data instanceof Buffer && (data = Buffer.from(bitmap.data)), (bitmap.data instanceof Uint8Array || bitmap.data instanceof Uint8ClampedArray) && (data = Buffer.from(bitmap.data.buffer)), 
      Array.isArray(bitmap.data) && (data = Buffer.concat(bitmap.data.map(hex => Buffer.from(hex.toString(16).padStart(8, "0"), "hex")))), 
      !data) {
        throw new Error("data must be a Buffer");
      }
      if ("number" != typeof bitmap.height || "number" != typeof bitmap.width) {
        throw new Error("bitmap must have width and height");
      }
      return new CustomJimp({
        height: bitmap.height,
        width: bitmap.width,
        data: data
      });
    }
    static async fromBuffer(buffer, options) {
      const actualBuffer = buffer instanceof ArrayBuffer ? bufferFromArrayBuffer(buffer) : buffer, mime = await fileType.fromBuffer(actualBuffer);
      if (!mime || !mime.mime) {
        throw new Error("Could not find MIME for Buffer");
      }
      const format = formats.find(format => format.mime === mime.mime);
      if (!format || !format.decode) {
        throw new Error(`Mime type ${mime.mime} does not support decoding`);
      }
      const image = new CustomJimp(await format.decode(actualBuffer, options?.[format.mime]));
      return image.mime = mime.mime, attemptExifRotate(image, actualBuffer), image;
    }
    inspect() {
      return "<Jimp " + (this.bitmap === emptyBitmap ? "pending..." : this.bitmap.width + "x" + this.bitmap.height) + ">";
    }
    toString() {
      return "[object Jimp]";
    }
    get width() {
      return this.bitmap.width;
    }
    get height() {
      return this.bitmap.height;
    }
    async getBuffer(mime, options) {
      const format = this.formats.find(format => format.mime === mime);
      if (!format || !format.encode) {
        throw new Error(`Unsupported MIME type: ${mime}`);
      }
      let outputImage;
      return format.hasAlpha ? outputImage = this : (outputImage = new CustomJimp({
        width: this.bitmap.width,
        height: this.bitmap.height,
        color: this.background
      }), composite(outputImage, this)), format.encode(outputImage.bitmap, options);
    }
    async getBase64(mime, options) {
      return "data:" + mime + ";base64," + (await this.getBuffer(mime, options)).toString("base64");
    }
    async write(path, options) {
      const mimeType = mime.getType(path);
      await writeFile(path, await this.getBuffer(mimeType, options));
    }
    clone() {
      return new CustomJimp({
        ...this.bitmap,
        data: Buffer.from(this.bitmap.data)
      });
    }
    getPixelIndex(x, y, edgeHandling) {
      let xi, yi;
      if (edgeHandling || (edgeHandling = Edge.EXTEND), "number" != typeof x || "number" != typeof y) {
        throw new Error("x and y must be numbers");
      }
      xi = x = Math.round(x), yi = y = Math.round(y), edgeHandling === Edge.EXTEND && (x < 0 && (xi = 0), 
      x >= this.bitmap.width && (xi = this.bitmap.width - 1), y < 0 && (yi = 0), y >= this.bitmap.height && (yi = this.bitmap.height - 1)), 
      edgeHandling === Edge.WRAP && (x < 0 && (xi = this.bitmap.width + x), x >= this.bitmap.width && (xi = x % this.bitmap.width), 
      y < 0 && (yi = this.bitmap.height + y), y >= this.bitmap.height && (yi = y % this.bitmap.height));
      let i = this.bitmap.width * yi + xi << 2;
      return (xi < 0 || xi >= this.bitmap.width) && (i = -1), (yi < 0 || yi >= this.bitmap.height) && (i = -1), 
      i;
    }
    getPixelColor(x, y) {
      if ("number" != typeof x || "number" != typeof y) {
        throw new Error("x and y must be numbers");
      }
      const idx = this.getPixelIndex(x, y);
      return this.bitmap.data.readUInt32BE(idx);
    }
    setPixelColor(hex, x, y) {
      if ("number" != typeof hex || "number" != typeof x || "number" != typeof y) {
        throw new Error("hex, x and y must be numbers");
      }
      const idx = this.getPixelIndex(x, y);
      return this.bitmap.data.writeUInt32BE(hex, idx), this;
    }
    hasAlpha() {
      const {width: width, height: height, data: data} = this.bitmap, byteLen = width * height << 2;
      for (let idx = 3; idx < byteLen; idx += 4) {
        if (255 !== data[idx]) {
          return !0;
        }
      }
      return !1;
    }
    composite(src, x = 0, y = 0, options = {}) {
      return composite(this, src, x, y, options);
    }
    scan(x, y, w, h, f) {
      return scan(this, x, y, w, h, f);
    }
    scanIterator(x = 0, y = 0, w = this.bitmap.width, h = this.bitmap.height) {
      if ("number" != typeof x || "number" != typeof y) {
        throw new Error("x and y must be numbers");
      }
      if ("number" != typeof w || "number" != typeof h) {
        throw new Error("w and h must be numbers");
      }
      return scanIterator(this, x, y, w, h);
    }
  };
  return CustomJimp;
}

var HeaderTypes, BmpCompression, ResizeStrategy;

function maskColor(maskRed, maskGreen, maskBlue, maskAlpha) {
  const maskRedR = 1 + ~maskRed & maskRed, maskGreenR = 1 + ~maskGreen & maskGreen, maskBlueR = 1 + ~maskBlue & maskBlue, maskAlphaR = 1 + ~maskAlpha & maskAlpha, shiftedMaskRedL = maskRed / maskRedR + 1, shiftedMaskGreenL = maskGreen / maskGreenR + 1, shiftedMaskBlueL = maskBlue / maskBlueR + 1, shiftedMaskAlphaL = maskAlpha / maskAlphaR + 1;
  return {
    shiftRed: x => (x & maskRed) / maskRedR * 256 / shiftedMaskRedL,
    shiftGreen: x => (x & maskGreen) / maskGreenR * 256 / shiftedMaskGreenL,
    shiftBlue: x => (x & maskBlue) / maskBlueR * 256 / shiftedMaskBlueL,
    shiftAlpha: 0 !== maskAlpha ? x => (x & maskAlpha) / maskAlphaR * 256 / shiftedMaskAlphaL : () => 255
  };
}

!function(HeaderTypes) {
  HeaderTypes[HeaderTypes.BITMAP_INFO_HEADER = 40] = "BITMAP_INFO_HEADER", HeaderTypes[HeaderTypes.BITMAP_V2_INFO_HEADER = 52] = "BITMAP_V2_INFO_HEADER", 
  HeaderTypes[HeaderTypes.BITMAP_V3_INFO_HEADER = 56] = "BITMAP_V3_INFO_HEADER", HeaderTypes[HeaderTypes.BITMAP_V4_HEADER = 108] = "BITMAP_V4_HEADER", 
  HeaderTypes[HeaderTypes.BITMAP_V5_HEADER = 124] = "BITMAP_V5_HEADER";
}(HeaderTypes || (HeaderTypes = {})), function(BmpCompression) {
  BmpCompression[BmpCompression.NONE = 0] = "NONE", BmpCompression[BmpCompression.BI_RLE8 = 1] = "BI_RLE8", 
  BmpCompression[BmpCompression.BI_RLE4 = 2] = "BI_RLE4", BmpCompression[BmpCompression.BI_BIT_FIELDS = 3] = "BI_BIT_FIELDS", 
  BmpCompression[BmpCompression.BI_ALPHA_BIT_FIELDS = 6] = "BI_ALPHA_BIT_FIELDS";
}(BmpCompression || (BmpCompression = {}));

class BmpDecoder {
  flag;
  fileSize;
  reserved1;
  reserved2;
  offset;
  headerSize;
  width;
  height;
  planes;
  bitPP;
  compression;
  rawSize;
  hr;
  vr;
  colors;
  importantColors;
  palette;
  data;
  maskRed;
  maskGreen;
  maskBlue;
  maskAlpha;
  toRGBA;
  pos;
  bottomUp;
  buffer;
  locRed;
  locGreen;
  locBlue;
  locAlpha;
  shiftRed;
  shiftGreen;
  shiftBlue;
  shiftAlpha;
  constructor(buffer, {toRGBA: toRGBA} = {
    toRGBA: !1
  }) {
    if (this.buffer = buffer, this.toRGBA = !!toRGBA, this.pos = 0, this.bottomUp = !0, 
    this.flag = this.buffer.toString("utf-8", 0, this.pos += 2), "BM" !== this.flag) {
      throw new Error("Invalid BMP File");
    }
    this.locRed = this.toRGBA ? 0 : 3, this.locGreen = this.toRGBA ? 1 : 2, this.locBlue = this.toRGBA ? 2 : 1, 
    this.locAlpha = this.toRGBA ? 3 : 0, this.parseHeader(), this.parseRGBA();
  }
  parseHeader() {
    if (this.fileSize = this.readUInt32LE(), this.reserved1 = this.buffer.readUInt16LE(this.pos), 
    this.pos += 2, this.reserved2 = this.buffer.readUInt16LE(this.pos), this.pos += 2, 
    this.offset = this.readUInt32LE(), this.headerSize = this.readUInt32LE(), !(this.headerSize in HeaderTypes)) {
      throw new Error(`Unsupported BMP header size ${this.headerSize}`);
    }
    if (this.width = this.readUInt32LE(), this.height = this.readUInt32LE(), this.height = this.height > 2147483647 ? this.height - 4294967296 : this.height, 
    this.planes = this.buffer.readUInt16LE(this.pos), this.pos += 2, this.bitPP = this.buffer.readUInt16LE(this.pos), 
    this.pos += 2, this.compression = this.readUInt32LE(), this.rawSize = this.readUInt32LE(), 
    this.hr = this.readUInt32LE(), this.vr = this.readUInt32LE(), this.colors = this.readUInt32LE(), 
    this.importantColors = this.readUInt32LE(), 32 === this.bitPP ? (this.maskAlpha = 0, 
    this.maskRed = 16711680, this.maskGreen = 65280, this.maskBlue = 255) : 16 === this.bitPP && (this.maskAlpha = 0, 
    this.maskRed = 31744, this.maskGreen = 992, this.maskBlue = 31), (this.headerSize > HeaderTypes.BITMAP_INFO_HEADER || this.compression === BmpCompression.BI_BIT_FIELDS || this.compression === BmpCompression.BI_ALPHA_BIT_FIELDS) && (this.maskRed = this.readUInt32LE(), 
    this.maskGreen = this.readUInt32LE(), this.maskBlue = this.readUInt32LE()), (this.headerSize > HeaderTypes.BITMAP_V2_INFO_HEADER || this.compression === BmpCompression.BI_ALPHA_BIT_FIELDS) && (this.maskAlpha = this.readUInt32LE()), 
    this.headerSize > HeaderTypes.BITMAP_V3_INFO_HEADER && (this.pos += HeaderTypes.BITMAP_V4_HEADER - HeaderTypes.BITMAP_V3_INFO_HEADER), 
    this.headerSize > HeaderTypes.BITMAP_V4_HEADER && (this.pos += HeaderTypes.BITMAP_V5_HEADER - HeaderTypes.BITMAP_V4_HEADER), 
    this.bitPP <= 8 || this.colors > 0) {
      const len = 0 === this.colors ? 1 << this.bitPP : this.colors;
      this.palette = new Array(len);
      for (let i = 0; i < len; i++) {
        const blue = this.buffer.readUInt8(this.pos++), green = this.buffer.readUInt8(this.pos++), red = this.buffer.readUInt8(this.pos++), quad = this.buffer.readUInt8(this.pos++);
        this.palette[i] = {
          red: red,
          green: green,
          blue: blue,
          quad: quad
        };
      }
    }
    this.height < 0 && (this.height *= -1, this.bottomUp = !1);
    const coloShift = maskColor(this.maskRed, this.maskGreen, this.maskBlue, this.maskAlpha);
    this.shiftRed = coloShift.shiftRed, this.shiftGreen = coloShift.shiftGreen, this.shiftBlue = coloShift.shiftBlue, 
    this.shiftAlpha = coloShift.shiftAlpha;
  }
  parseRGBA() {
    switch (this.data = Buffer.alloc(this.width * this.height * 4), this.bitPP) {
     case 1:
      this.bit1();
      break;

     case 4:
      this.bit4();
      break;

     case 8:
      this.bit8();
      break;

     case 16:
      this.bit16();
      break;

     case 24:
      this.bit24();
      break;

     default:
      this.bit32();
    }
  }
  bit1() {
    const xLen = Math.ceil(this.width / 8), mode = xLen % 4, padding = 0 !== mode ? 4 - mode : 0;
    this.scanImage(padding, xLen, (x, line) => {
      const b = this.buffer.readUInt8(this.pos++), location = line * this.width * 4 + 8 * x * 4;
      for (let i = 0; i < 8 && 8 * x + i < this.width; i++) {
        const rgb = this.palette[b >> 7 - i & 1];
        this.data[location + i * this.locAlpha] = 0, this.data[location + 4 * i + this.locBlue] = rgb.blue, 
        this.data[location + 4 * i + this.locGreen] = rgb.green, this.data[location + 4 * i + this.locRed] = rgb.red;
      }
    });
  }
  bit4() {
    if (this.compression === BmpCompression.BI_RLE4) {
      this.data.fill(0);
      let lowNibble = !1, lines = this.bottomUp ? this.height - 1 : 0, location = 0;
      for (;location < this.data.length; ) {
        const a = this.buffer.readUInt8(this.pos++), b = this.buffer.readUInt8(this.pos++);
        if (0 === a) {
          if (0 === b) {
            lines += this.bottomUp ? -1 : 1, location = lines * this.width * 4, lowNibble = !1;
            continue;
          }
          if (1 === b) {
            break;
          }
          if (2 === b) {
            const x = this.buffer.readUInt8(this.pos++), y = this.buffer.readUInt8(this.pos++);
            lines += this.bottomUp ? -y : y, location += y * this.width * 4 + 4 * x;
          } else {
            let c = this.buffer.readUInt8(this.pos++);
            for (let i = 0; i < b; i++) {
              location = this.setPixelData(location, lowNibble ? 15 & c : (240 & c) >> 4), 1 & i && i + 1 < b && (c = this.buffer.readUInt8(this.pos++)), 
              lowNibble = !lowNibble;
            }
            1 == (b + 1 >> 1 & 1) && this.pos++;
          }
        } else {
          for (let i = 0; i < a; i++) {
            location = this.setPixelData(location, lowNibble ? 15 & b : (240 & b) >> 4), lowNibble = !lowNibble;
          }
        }
      }
    } else {
      const xLen = Math.ceil(this.width / 2), mode = xLen % 4, padding = 0 !== mode ? 4 - mode : 0;
      this.scanImage(padding, xLen, (x, line) => {
        const b = this.buffer.readUInt8(this.pos++), location = line * this.width * 4 + 2 * x * 4, first4 = b >> 4;
        let rgb = this.palette[first4];
        if (this.data[location] = 0, this.data[location + 1] = rgb.blue, this.data[location + 2] = rgb.green, 
        this.data[location + 3] = rgb.red, 2 * x + 1 >= this.width) {
          return !1;
        }
        const last4 = 15 & b;
        rgb = this.palette[last4], this.data[location + 4] = 0, this.data[location + 4 + 1] = rgb.blue, 
        this.data[location + 4 + 2] = rgb.green, this.data[location + 4 + 3] = rgb.red;
      });
    }
  }
  bit8() {
    if (this.compression === BmpCompression.BI_RLE8) {
      this.data.fill(0);
      let lines = this.bottomUp ? this.height - 1 : 0, location = 0;
      for (;location < this.data.length; ) {
        const a = this.buffer.readUInt8(this.pos++), b = this.buffer.readUInt8(this.pos++);
        if (0 === a) {
          if (0 === b) {
            lines += this.bottomUp ? -1 : 1, location = lines * this.width * 4;
            continue;
          }
          if (1 === b) {
            break;
          }
          if (2 === b) {
            const x = this.buffer.readUInt8(this.pos++), y = this.buffer.readUInt8(this.pos++);
            lines += this.bottomUp ? -y : y, location += y * this.width * 4 + 4 * x;
          } else {
            for (let i = 0; i < b; i++) {
              const c = this.buffer.readUInt8(this.pos++);
              location = this.setPixelData(location, c);
            }
            !0 & b && this.pos++;
          }
        } else {
          for (let i = 0; i < a; i++) {
            location = this.setPixelData(location, b);
          }
        }
      }
    } else {
      const mode = this.width % 4, padding = 0 !== mode ? 4 - mode : 0;
      this.scanImage(padding, this.width, (x, line) => {
        const b = this.buffer.readUInt8(this.pos++), location = line * this.width * 4 + 4 * x;
        if (b < this.palette.length) {
          const rgb = this.palette[b];
          this.data[location] = 0, this.data[location + 1] = rgb.blue, this.data[location + 2] = rgb.green, 
          this.data[location + 3] = rgb.red;
        } else {
          this.data[location] = 0, this.data[location + 1] = 255, this.data[location + 2] = 255, 
          this.data[location + 3] = 255;
        }
      });
    }
  }
  bit16() {
    const padding = this.width % 2 * 2;
    this.scanImage(padding, this.width, (x, line) => {
      const loc = line * this.width * 4 + 4 * x, px = this.buffer.readUInt16LE(this.pos);
      this.pos += 2, this.data[loc + this.locRed] = this.shiftRed(px), this.data[loc + this.locGreen] = this.shiftGreen(px), 
      this.data[loc + this.locBlue] = this.shiftBlue(px), this.data[loc + this.locAlpha] = this.shiftAlpha(px);
    });
  }
  bit24() {
    const padding = this.width % 4;
    this.scanImage(padding, this.width, (x, line) => {
      const loc = line * this.width * 4 + 4 * x, blue = this.buffer.readUInt8(this.pos++), green = this.buffer.readUInt8(this.pos++), red = this.buffer.readUInt8(this.pos++);
      this.data[loc + this.locRed] = red, this.data[loc + this.locGreen] = green, this.data[loc + this.locBlue] = blue, 
      this.data[loc + this.locAlpha] = 0;
    });
  }
  bit32() {
    this.scanImage(0, this.width, (x, line) => {
      const loc = line * this.width * 4 + 4 * x, px = this.readUInt32LE();
      this.data[loc + this.locRed] = this.shiftRed(px), this.data[loc + this.locGreen] = this.shiftGreen(px), 
      this.data[loc + this.locBlue] = this.shiftBlue(px), this.data[loc + this.locAlpha] = this.shiftAlpha(px);
    });
  }
  scanImage(padding = 0, width = this.width, processPixel) {
    for (let y = this.height - 1; y >= 0; y--) {
      const line = this.bottomUp ? y : this.height - 1 - y;
      for (let x = 0; x < width; x++) {
        if (!1 === processPixel.call(this, x, line)) {
          return;
        }
      }
      this.pos += padding;
    }
  }
  readUInt32LE() {
    const value = this.buffer.readUInt32LE(this.pos);
    return this.pos += 4, value;
  }
  setPixelData(location, rgbIndex) {
    const {blue: blue, green: green, red: red} = this.palette[rgbIndex];
    return this.data[location + this.locAlpha] = 0, this.data[location + 1 + this.locBlue] = blue, 
    this.data[location + 2 + this.locGreen] = green, this.data[location + 3 + this.locRed] = red, 
    location + 4;
  }
}

function createInteger(numbers) {
  return numbers.reduce((final, n) => final << 1 | n, 0);
}

function createColor(color) {
  return color.quad << 24 | color.red << 16 | color.green << 8 | color.blue;
}

class BmpEncoder {
  fileSize;
  reserved1;
  reserved2;
  offset;
  width;
  flag;
  height;
  planes;
  bitPP;
  compress;
  hr;
  vr;
  colors;
  importantColors;
  rawSize;
  headerSize;
  data;
  palette;
  extraBytes;
  buffer;
  bytesInColor;
  pos;
  constructor(imgData) {
    switch (this.buffer = imgData.data, this.width = imgData.width, this.height = imgData.height, 
    this.headerSize = HeaderTypes.BITMAP_INFO_HEADER, this.flag = "BM", this.bitPP = imgData.bitPP || 24, 
    this.offset = 54, this.reserved1 = imgData.reserved1 || 0, this.reserved2 = imgData.reserved2 || 0, 
    this.planes = 1, this.compress = 0, this.hr = imgData.hr || 0, this.vr = imgData.vr || 0, 
    this.importantColors = imgData.importantColors || 0, this.colors = Math.min(2 ** (this.bitPP - 1 || 1), imgData.colors || 1 / 0), 
    this.palette = imgData.palette || [], this.colors && this.bitPP < 16 ? this.offset += 4 * this.colors : this.colors = 0, 
    this.bitPP) {
     case 32:
      this.bytesInColor = 4;
      break;

     case 16:
      this.bytesInColor = 2;
      break;

     case 8:
      this.bytesInColor = 1;
      break;

     case 4:
      this.bytesInColor = .5;
      break;

     case 1:
      this.bytesInColor = 1 / 8;
      break;

     default:
      this.bytesInColor = 3, this.bitPP = 24;
    }
    const rowWidth = this.width * this.bitPP / 32, rowBytes = Math.ceil(rowWidth);
    this.extraBytes = 4 * (rowBytes - rowWidth), this.rawSize = this.height * rowBytes * 4 + 2, 
    this.fileSize = this.rawSize + this.offset, this.data = Buffer.alloc(this.fileSize, 1), 
    this.pos = 0, this.encode();
  }
  encode() {
    switch (this.pos = 0, this.writeHeader(), this.bitPP) {
     case 32:
      this.bit32();
      break;

     case 16:
      this.bit16();
      break;

     case 8:
      this.bit8();
      break;

     case 4:
      this.bit4();
      break;

     case 1:
      this.bit1();
      break;

     default:
      this.bit24();
    }
  }
  writeHeader() {
    this.data.write(this.flag, this.pos, 2), this.pos += 2, this.writeUInt32LE(this.fileSize), 
    this.writeUInt32LE(this.reserved1 << 16 | this.reserved2), this.writeUInt32LE(this.offset), 
    this.writeUInt32LE(this.headerSize), this.writeUInt32LE(this.width), this.writeUInt32LE(this.height), 
    this.data.writeUInt16LE(this.planes, this.pos), this.pos += 2, this.data.writeUInt16LE(this.bitPP, this.pos), 
    this.pos += 2, this.writeUInt32LE(this.compress), this.writeUInt32LE(this.rawSize), 
    this.writeUInt32LE(this.hr), this.writeUInt32LE(this.vr), this.writeUInt32LE(this.colors), 
    this.writeUInt32LE(this.importantColors);
  }
  bit1() {
    this.palette.length && 2 === this.colors ? this.initColors(1) : (this.writeUInt32LE(16777215), 
    this.writeUInt32LE(0)), this.pos += 1;
    let lineArr = [];
    this.writeImage((p, index, x) => {
      let i = index;
      i++;
      const b = this.buffer[i++], g = this.buffer[i++], brightness = .2126 * this.buffer[i++] + .7152 * g + .0722 * b;
      return lineArr.push(brightness > 127 ? 0 : 1), (x + 1) % 8 == 0 ? (this.data[p - 1] = createInteger(lineArr), 
      lineArr = []) : x === this.width - 1 && lineArr.length > 0 && (this.data[p - 1] = createInteger(lineArr) << 4, 
      lineArr = []), i;
    });
  }
  bit4() {
    const colors = this.initColors(4);
    let integerPair = [];
    this.writeImage((p, index, x) => {
      let i = index;
      const colorInt = createColor({
        quad: this.buffer[i++],
        blue: this.buffer[i++],
        green: this.buffer[i++],
        red: this.buffer[i++]
      }), colorExists = colors.findIndex(c => c === colorInt);
      return -1 !== colorExists ? integerPair.push(colorExists) : integerPair.push(0), 
      (x + 1) % 2 == 0 && (this.data[p] = integerPair[0] << 4 | integerPair[1], integerPair = []), 
      i;
    });
  }
  bit8() {
    const colors = this.initColors(8);
    this.writeImage((p, index) => {
      let i = index;
      const colorInt = createColor({
        quad: this.buffer[i++],
        blue: this.buffer[i++],
        green: this.buffer[i++],
        red: this.buffer[i++]
      }), colorExists = colors.findIndex(c => c === colorInt);
      return this.data[p] = -1 !== colorExists ? colorExists : 0, i;
    });
  }
  bit16() {
    this.writeImage((p, index) => {
      let i = index + 1;
      const b = this.buffer[i++] / 8, g = this.buffer[i++] / 8, color = this.buffer[i++] / 8 << 10 | g << 5 | b;
      return this.data[p] = 255 & color, this.data[p + 1] = (65280 & color) >> 8, i;
    });
  }
  bit24() {
    this.writeImage((p, index) => {
      let i = index + 1;
      return this.data[p] = this.buffer[i++], this.data[p + 1] = this.buffer[i++], this.data[p + 2] = this.buffer[i++], 
      i;
    });
  }
  bit32() {
    this.writeImage((p, index) => {
      let i = index;
      return this.data[p + 3] = this.buffer[i++], this.data[p] = this.buffer[i++], this.data[p + 1] = this.buffer[i++], 
      this.data[p + 2] = this.buffer[i++], i;
    });
  }
  writeImage(writePixel) {
    const rowBytes = this.extraBytes + this.width * this.bytesInColor;
    let i = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const p = Math.floor(this.pos + (this.height - 1 - y) * rowBytes + x * this.bytesInColor);
        i = writePixel.call(this, p, i, x, y);
      }
    }
  }
  initColors(bit) {
    const colors = [];
    if (!this.palette.length) {
      throw new Error(`To encode ${bit}-bit BMPs a pallette is needed. Please choose up to ${this.colors} colors. Colors must be 32-bit integers.`);
    }
    for (let i = 0; i < this.colors; i++) {
      const rootColor = createColor(this.palette[i]);
      this.writeUInt32LE(rootColor), colors.push(rootColor);
    }
    return colors;
  }
  writeUInt32LE(value) {
    this.data.writeUInt32LE(value, this.pos), this.pos += 4;
  }
}

function decode$1(bmpData, options) {
  return new BmpDecoder(bmpData, options);
}

function encode$1(imgData) {
  return new BmpEncoder(imgData);
}

function encode(image, options = {}) {
  return scan({
    bitmap: image
  }, 0, 0, image.width, image.height, function(_, __, index) {
    const red = image.data[index + 0], green = image.data[index + 1], blue = image.data[index + 2], alpha = image.data[index + 3];
    image.data[index + 0] = alpha, image.data[index + 1] = blue, image.data[index + 2] = green, 
    image.data[index + 3] = red;
  }), encode$1({
    ...image,
    ...options
  }).data;
}

function decode(data, options) {
  const result = decode$1(data, options);
  return scan({
    bitmap: result
  }, 0, 0, result.width, result.height, function(_, __, index) {
    const blue = result.data[index + 1], green = result.data[index + 2], red = result.data[index + 3];
    result.data[index + 0] = red, result.data[index + 1] = green, result.data[index + 2] = blue, 
    result.data[index + 3] = 255;
  }), result;
}

function bmp() {
  return {
    mime: "image/bmp",
    encode: encode,
    decode: decode
  };
}

function jpeg() {
  return {
    mime: "image/jpeg",
    encode: (bitmap, {quality: quality = 100} = {}) => JPEG.encode(bitmap, quality).data,
    decode: (data, options) => JPEG.decode(data, options)
  };
}

function Resize(widthOriginal, heightOriginal, targetWidth, targetHeight, blendAlpha, interpolationPass, resizeCallback) {
  this.widthOriginal = Math.abs(Math.floor(widthOriginal) || 0), this.heightOriginal = Math.abs(Math.floor(heightOriginal) || 0), 
  this.targetWidth = Math.abs(Math.floor(targetWidth) || 0), this.targetHeight = Math.abs(Math.floor(targetHeight) || 0), 
  this.colorChannels = blendAlpha ? 4 : 3, this.interpolationPass = Boolean(interpolationPass), 
  this.resizeCallback = "function" == typeof resizeCallback ? resizeCallback : function() {}, 
  this.targetWidthMultipliedByChannels = this.targetWidth * this.colorChannels, this.originalWidthMultipliedByChannels = this.widthOriginal * this.colorChannels, 
  this.originalHeightMultipliedByChannels = this.heightOriginal * this.colorChannels, 
  this.widthPassResultSize = this.targetWidthMultipliedByChannels * this.heightOriginal, 
  this.finalResultSize = this.targetWidthMultipliedByChannels * this.targetHeight, 
  this.initialize();
}

!function(ResizeStrategy) {
  ResizeStrategy.NEAREST_NEIGHBOR = "nearestNeighbor", ResizeStrategy.BILINEAR = "bilinearInterpolation", 
  ResizeStrategy.BICUBIC = "bicubicInterpolation", ResizeStrategy.HERMITE = "hermiteInterpolation", 
  ResizeStrategy.BEZIER = "bezierInterpolation";
}(ResizeStrategy || (ResizeStrategy = {})), Resize.prototype.initialize = function() {
  if (!(this.widthOriginal > 0 && this.heightOriginal > 0 && this.targetWidth > 0 && this.targetHeight > 0)) {
    throw console.log(this), new Error("Invalid settings specified for the resizer.");
  }
  this.configurePasses();
}, Resize.prototype.configurePasses = function() {
  this.widthOriginal === this.targetWidth ? this.resizeWidth = this.bypassResizer : (this.ratioWeightWidthPass = this.widthOriginal / this.targetWidth, 
  this.ratioWeightWidthPass < 1 && this.interpolationPass ? (this.initializeFirstPassBuffers(!0), 
  this.resizeWidth = 4 === this.colorChannels ? this.resizeWidthInterpolatedRGBA : this.resizeWidthInterpolatedRGB) : (this.initializeFirstPassBuffers(!1), 
  this.resizeWidth = 4 === this.colorChannels ? this.resizeWidthRGBA : this.resizeWidthRGB)), 
  this.heightOriginal === this.targetHeight ? this.resizeHeight = this.bypassResizer : (this.ratioWeightHeightPass = this.heightOriginal / this.targetHeight, 
  this.ratioWeightHeightPass < 1 && this.interpolationPass ? (this.initializeSecondPassBuffers(!0), 
  this.resizeHeight = this.resizeHeightInterpolated) : (this.initializeSecondPassBuffers(!1), 
  this.resizeHeight = 4 === this.colorChannels ? this.resizeHeightRGBA : this.resizeHeightRGB));
}, Resize.prototype._resizeWidthInterpolatedRGBChannels = function(buffer, fourthChannel) {
  const channelsNum = fourthChannel ? 4 : 3, ratioWeight = this.ratioWeightWidthPass, outputBuffer = this.widthBuffer;
  let targetPosition, interpolationWidthSourceReadStop, weight = 0, finalOffset = 0, pixelOffset = 0, firstWeight = 0, secondWeight = 0;
  for (targetPosition = 0; weight < 1 / 3; targetPosition += channelsNum, weight += ratioWeight) {
    for (finalOffset = targetPosition, pixelOffset = 0; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, 
    finalOffset += this.targetWidthMultipliedByChannels) {
      outputBuffer[finalOffset] = buffer[pixelOffset], outputBuffer[finalOffset + 1] = buffer[pixelOffset + 1], 
      outputBuffer[finalOffset + 2] = buffer[pixelOffset + 2], fourthChannel && (outputBuffer[finalOffset + 3] = buffer[pixelOffset + 3]);
    }
  }
  for (weight -= 1 / 3, interpolationWidthSourceReadStop = this.widthOriginal - 1; weight < interpolationWidthSourceReadStop; targetPosition += channelsNum, 
  weight += ratioWeight) {
    for (secondWeight = weight % 1, firstWeight = 1 - secondWeight, finalOffset = targetPosition, 
    pixelOffset = Math.floor(weight) * channelsNum; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, 
    finalOffset += this.targetWidthMultipliedByChannels) {
      outputBuffer[finalOffset + 0] = buffer[pixelOffset + 0] * firstWeight + buffer[pixelOffset + channelsNum + 0] * secondWeight, 
      outputBuffer[finalOffset + 1] = buffer[pixelOffset + 1] * firstWeight + buffer[pixelOffset + channelsNum + 1] * secondWeight, 
      outputBuffer[finalOffset + 2] = buffer[pixelOffset + 2] * firstWeight + buffer[pixelOffset + channelsNum + 2] * secondWeight, 
      fourthChannel && (outputBuffer[finalOffset + 3] = buffer[pixelOffset + 3] * firstWeight + buffer[pixelOffset + channelsNum + 3] * secondWeight);
    }
  }
  for (interpolationWidthSourceReadStop = this.originalWidthMultipliedByChannels - channelsNum; targetPosition < this.targetWidthMultipliedByChannels; targetPosition += channelsNum) {
    for (finalOffset = targetPosition, pixelOffset = interpolationWidthSourceReadStop; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, 
    finalOffset += this.targetWidthMultipliedByChannels) {
      outputBuffer[finalOffset] = buffer[pixelOffset], outputBuffer[finalOffset + 1] = buffer[pixelOffset + 1], 
      outputBuffer[finalOffset + 2] = buffer[pixelOffset + 2], fourthChannel && (outputBuffer[finalOffset + 3] = buffer[pixelOffset + 3]);
    }
  }
  return outputBuffer;
}, Resize.prototype._resizeWidthRGBChannels = function(buffer, fourthChannel) {
  const channelsNum = fourthChannel ? 4 : 3, ratioWeight = this.ratioWeightWidthPass, ratioWeightDivisor = 1 / ratioWeight, nextLineOffsetOriginalWidth = this.originalWidthMultipliedByChannels - channelsNum + 1, nextLineOffsetTargetWidth = this.targetWidthMultipliedByChannels - channelsNum + 1, output = this.outputWidthWorkBench, outputBuffer = this.widthBuffer, trustworthyColorsCount = this.outputWidthWorkBenchOpaquePixelsCount;
  let weight = 0, amountToNext = 0, actualPosition = 0, currentPosition = 0, line = 0, pixelOffset = 0, outputOffset = 0, multiplier = 1, r = 0, g = 0, b = 0, a = 0;
  do {
    for (line = 0; line < this.originalHeightMultipliedByChannels; ) {
      output[line++] = 0, output[line++] = 0, output[line++] = 0, fourthChannel && (output[line++] = 0, 
      trustworthyColorsCount[line / channelsNum - 1] = 0);
    }
    weight = ratioWeight;
    do {
      for (amountToNext = 1 + actualPosition - currentPosition, multiplier = Math.min(weight, amountToNext), 
      line = 0, pixelOffset = actualPosition; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetOriginalWidth) {
        r = buffer[pixelOffset], g = buffer[++pixelOffset], b = buffer[++pixelOffset], a = fourthChannel ? buffer[++pixelOffset] : 255, 
        output[line++] += (a ? r : 0) * multiplier, output[line++] += (a ? g : 0) * multiplier, 
        output[line++] += (a ? b : 0) * multiplier, fourthChannel && (output[line++] += a * multiplier, 
        trustworthyColorsCount[line / channelsNum - 1] += a ? multiplier : 0);
      }
      if (!(weight >= amountToNext)) {
        currentPosition += weight;
        break;
      }
      actualPosition += channelsNum, currentPosition = actualPosition, weight -= amountToNext;
    } while (weight > 0 && actualPosition < this.originalWidthMultipliedByChannels);
    for (line = 0, pixelOffset = outputOffset; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetTargetWidth) {
      weight = fourthChannel ? trustworthyColorsCount[line / channelsNum] : 1, multiplier = fourthChannel ? weight ? 1 / weight : 0 : ratioWeightDivisor, 
      outputBuffer[pixelOffset] = output[line++] * multiplier, outputBuffer[++pixelOffset] = output[line++] * multiplier, 
      outputBuffer[++pixelOffset] = output[line++] * multiplier, fourthChannel && (outputBuffer[++pixelOffset] = output[line++] * ratioWeightDivisor);
    }
    outputOffset += channelsNum;
  } while (outputOffset < this.targetWidthMultipliedByChannels);
  return outputBuffer;
}, Resize.prototype._resizeHeightRGBChannels = function(buffer, fourthChannel) {
  const ratioWeight = this.ratioWeightHeightPass, ratioWeightDivisor = 1 / ratioWeight, output = this.outputHeightWorkBench, outputBuffer = this.heightBuffer, trustworthyColorsCount = this.outputHeightWorkBenchOpaquePixelsCount;
  let weight = 0, amountToNext = 0, actualPosition = 0, currentPosition = 0, pixelOffset = 0, outputOffset = 0, caret = 0, multiplier = 1, r = 0, g = 0, b = 0, a = 0;
  do {
    for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels; ) {
      output[pixelOffset++] = 0, output[pixelOffset++] = 0, output[pixelOffset++] = 0, 
      fourthChannel && (output[pixelOffset++] = 0, trustworthyColorsCount[pixelOffset / 4 - 1] = 0);
    }
    weight = ratioWeight;
    do {
      for (amountToNext = 1 + actualPosition - currentPosition, multiplier = Math.min(weight, amountToNext), 
      caret = actualPosition, pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels; ) {
        r = buffer[caret++], g = buffer[caret++], b = buffer[caret++], a = fourthChannel ? buffer[caret++] : 255, 
        output[pixelOffset++] += (a ? r : 0) * multiplier, output[pixelOffset++] += (a ? g : 0) * multiplier, 
        output[pixelOffset++] += (a ? b : 0) * multiplier, fourthChannel && (output[pixelOffset++] += a * multiplier, 
        trustworthyColorsCount[pixelOffset / 4 - 1] += a ? multiplier : 0);
      }
      if (!(weight >= amountToNext)) {
        currentPosition += weight;
        break;
      }
      actualPosition = caret, currentPosition = actualPosition, weight -= amountToNext;
    } while (weight > 0 && actualPosition < this.widthPassResultSize);
    for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels; ) {
      weight = fourthChannel ? trustworthyColorsCount[pixelOffset / 4] : 1, multiplier = fourthChannel ? weight ? 1 / weight : 0 : ratioWeightDivisor, 
      outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * multiplier), outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * multiplier), 
      outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * multiplier), fourthChannel && (outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * ratioWeightDivisor));
    }
  } while (outputOffset < this.finalResultSize);
  return outputBuffer;
}, Resize.prototype.resizeWidthInterpolatedRGB = function(buffer) {
  return this._resizeWidthInterpolatedRGBChannels(buffer, !1);
}, Resize.prototype.resizeWidthInterpolatedRGBA = function(buffer) {
  return this._resizeWidthInterpolatedRGBChannels(buffer, !0);
}, Resize.prototype.resizeWidthRGB = function(buffer) {
  return this._resizeWidthRGBChannels(buffer, !1);
}, Resize.prototype.resizeWidthRGBA = function(buffer) {
  return this._resizeWidthRGBChannels(buffer, !0);
}, Resize.prototype.resizeHeightInterpolated = function(buffer) {
  const ratioWeight = this.ratioWeightHeightPass, outputBuffer = this.heightBuffer;
  let interpolationHeightSourceReadStop, weight = 0, finalOffset = 0, pixelOffset = 0, pixelOffsetAccumulated = 0, pixelOffsetAccumulated2 = 0, firstWeight = 0, secondWeight = 0;
  for (;weight < 1 / 3; weight += ratioWeight) {
    for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels; ) {
      outputBuffer[finalOffset++] = Math.round(buffer[pixelOffset++]);
    }
  }
  for (weight -= 1 / 3, interpolationHeightSourceReadStop = this.heightOriginal - 1; weight < interpolationHeightSourceReadStop; weight += ratioWeight) {
    for (secondWeight = weight % 1, firstWeight = 1 - secondWeight, pixelOffsetAccumulated = Math.floor(weight) * this.targetWidthMultipliedByChannels, 
    pixelOffsetAccumulated2 = pixelOffsetAccumulated + this.targetWidthMultipliedByChannels, 
    pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels; ++pixelOffset) {
      outputBuffer[finalOffset++] = Math.round(buffer[pixelOffsetAccumulated++] * firstWeight + buffer[pixelOffsetAccumulated2++] * secondWeight);
    }
  }
  for (;finalOffset < this.finalResultSize; ) {
    for (pixelOffset = 0, pixelOffsetAccumulated = interpolationHeightSourceReadStop * this.targetWidthMultipliedByChannels; pixelOffset < this.targetWidthMultipliedByChannels; ++pixelOffset) {
      outputBuffer[finalOffset++] = Math.round(buffer[pixelOffsetAccumulated++]);
    }
  }
  return outputBuffer;
}, Resize.prototype.resizeHeightRGB = function(buffer) {
  return this._resizeHeightRGBChannels(buffer, !1);
}, Resize.prototype.resizeHeightRGBA = function(buffer) {
  return this._resizeHeightRGBChannels(buffer, !0);
}, Resize.prototype.resize = function(buffer) {
  this.resizeCallback(this.resizeHeight(this.resizeWidth(buffer)));
}, Resize.prototype.bypassResizer = function(buffer) {
  return buffer;
}, Resize.prototype.initializeFirstPassBuffers = function(BILINEARAlgo) {
  this.widthBuffer = this.generateFloatBuffer(this.widthPassResultSize), BILINEARAlgo || (this.outputWidthWorkBench = this.generateFloatBuffer(this.originalHeightMultipliedByChannels), 
  this.colorChannels > 3 && (this.outputWidthWorkBenchOpaquePixelsCount = this.generateFloat64Buffer(this.heightOriginal)));
}, Resize.prototype.initializeSecondPassBuffers = function(BILINEARAlgo) {
  this.heightBuffer = this.generateUint8Buffer(this.finalResultSize), BILINEARAlgo || (this.outputHeightWorkBench = this.generateFloatBuffer(this.targetWidthMultipliedByChannels), 
  this.colorChannels > 3 && (this.outputHeightWorkBenchOpaquePixelsCount = this.generateFloat64Buffer(this.targetWidth)));
}, Resize.prototype.generateFloatBuffer = function(bufferLength) {
  try {
    return new Float32Array(bufferLength);
  } catch (error) {
    return console.error(error), [];
  }
}, Resize.prototype.generateFloat64Buffer = function(bufferLength) {
  try {
    return new Float64Array(bufferLength);
  } catch (error) {
    return console.error(error), [];
  }
}, Resize.prototype.generateUint8Buffer = function(bufferLength) {
  try {
    return new Uint8Array(bufferLength);
  } catch (error) {
    return console.error(error), [];
  }
};

const operations = {
  nearestNeighbor(src, dst) {
    const wSrc = src.width, hSrc = src.height, wDst = dst.width, hDst = dst.height, bufSrc = src.data, bufDst = dst.data;
    for (let i = 0; i < hDst; i++) {
      for (let j = 0; j < wDst; j++) {
        let posDst = 4 * (i * wDst + j);
        let posSrc = 4 * (Math.floor(i * hSrc / hDst) * wSrc + Math.floor(j * wSrc / wDst));
        bufDst[posDst++] = bufSrc[posSrc++], bufDst[posDst++] = bufSrc[posSrc++], bufDst[posDst++] = bufSrc[posSrc++], 
        bufDst[posDst++] = bufSrc[posSrc++];
      }
    }
  },
  bilinearInterpolation(src, dst) {
    const wSrc = src.width, hSrc = src.height, wDst = dst.width, hDst = dst.height, bufSrc = src.data, bufDst = dst.data, interpolate = function(k, kMin, vMin, kMax, vMax) {
      return kMin === kMax ? vMin : Math.round((k - kMin) * vMax + (kMax - k) * vMin);
    }, assign = function(pos, offset, x, xMin, xMax, y, yMin, yMax) {
      let posMin = 4 * (yMin * wSrc + xMin) + offset, posMax = 4 * (yMin * wSrc + xMax) + offset;
      const vMin = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);
      if (yMax === yMin) {
        bufDst[pos + offset] = vMin;
      } else {
        posMin = 4 * (yMax * wSrc + xMin) + offset, posMax = 4 * (yMax * wSrc + xMax) + offset;
        const vMax = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);
        bufDst[pos + offset] = interpolate(y, yMin, vMin, yMax, vMax);
      }
    };
    for (let i = 0; i < hDst; i++) {
      for (let j = 0; j < wDst; j++) {
        const posDst = 4 * (i * wDst + j), x = j * wSrc / wDst, xMin = Math.floor(x), xMax = Math.min(Math.ceil(x), wSrc - 1), y = i * hSrc / hDst, yMin = Math.floor(y), yMax = Math.min(Math.ceil(y), hSrc - 1);
        assign(posDst, 0, x, xMin, xMax, y, yMin, yMax), assign(posDst, 1, x, xMin, xMax, y, yMin, yMax), 
        assign(posDst, 2, x, xMin, xMax, y, yMin, yMax), assign(posDst, 3, x, xMin, xMax, y, yMin, yMax);
      }
    }
  },
  _interpolate2D(src, dst, options, interpolate) {
    const bufSrc = src.data, bufDst = dst.data, wSrc = src.width, hSrc = src.height, wDst = dst.width, hDst = dst.height, wM = Math.max(1, Math.floor(wSrc / wDst)), wDst2 = wDst * wM, hM = Math.max(1, Math.floor(hSrc / hDst)), hDst2 = hDst * hM, buf1 = Buffer.alloc(wDst2 * hSrc * 4);
    for (let i = 0; i < hSrc; i++) {
      for (let j = 0; j < wDst2; j++) {
        const x = j * (wSrc - 1) / wDst2, xPos = Math.floor(x), t = x - xPos, srcPos = 4 * (i * wSrc + xPos), buf1Pos = 4 * (i * wDst2 + j);
        for (let k = 0; k < 4; k++) {
          const kPos = srcPos + k, x0 = xPos > 0 ? bufSrc[kPos - 4] : 2 * bufSrc[kPos] - bufSrc[kPos + 4], x1 = bufSrc[kPos], x2 = bufSrc[kPos + 4], x3 = xPos < wSrc - 2 ? bufSrc[kPos + 8] : 2 * bufSrc[kPos + 4] - bufSrc[kPos];
          buf1[buf1Pos + k] = interpolate(x0, x1, x2, x3, t);
        }
      }
    }
    const buf2 = Buffer.alloc(wDst2 * hDst2 * 4);
    for (let i = 0; i < hDst2; i++) {
      for (let j = 0; j < wDst2; j++) {
        const y = i * (hSrc - 1) / hDst2, yPos = Math.floor(y), t = y - yPos, buf1Pos = 4 * (yPos * wDst2 + j), buf2Pos = 4 * (i * wDst2 + j);
        for (let k = 0; k < 4; k++) {
          const kPos = buf1Pos + k, y0 = yPos > 0 ? buf1[kPos - 4 * wDst2] : 2 * buf1[kPos] - buf1[kPos + 4 * wDst2], y1 = buf1[kPos], y2 = buf1[kPos + 4 * wDst2], y3 = yPos < hSrc - 2 ? buf1[kPos + 8 * wDst2] : 2 * buf1[kPos + 4 * wDst2] - buf1[kPos];
          buf2[buf2Pos + k] = interpolate(y0, y1, y2, y3, t);
        }
      }
    }
    const m = wM * hM;
    if (m > 1) {
      for (let i = 0; i < hDst; i++) {
        for (let j = 0; j < wDst; j++) {
          let r = 0, g = 0, b = 0, a = 0, realColors = 0;
          for (let y = 0; y < hM; y++) {
            const yPos = i * hM + y;
            for (let x = 0; x < wM; x++) {
              const xyPos = 4 * (yPos * wDst2 + (j * wM + x)), pixelAlpha = buf2[xyPos + 3];
              pixelAlpha && (r += buf2[xyPos], g += buf2[xyPos + 1], b += buf2[xyPos + 2], realColors++), 
              a += pixelAlpha;
            }
          }
          const pos = 4 * (i * wDst + j);
          bufDst[pos] = realColors ? Math.round(r / realColors) : 0, bufDst[pos + 1] = realColors ? Math.round(g / realColors) : 0, 
          bufDst[pos + 2] = realColors ? Math.round(b / realColors) : 0, bufDst[pos + 3] = Math.round(a / m);
        }
      }
    } else {
      dst.data = buf2;
    }
  },
  bicubicInterpolation(src, dst, options) {
    return this._interpolate2D(src, dst, options, function(x0, x1, x2, x3, t) {
      const a0 = x3 - x2 - x0 + x1, a1 = x0 - x1 - a0, a2 = x2 - x0, a3 = x1;
      return Math.max(0, Math.min(255, a0 * (t * t * t) + a1 * (t * t) + a2 * t + a3));
    });
  },
  hermiteInterpolation(src, dst, options) {
    return this._interpolate2D(src, dst, options, function(x0, x1, x2, x3, t) {
      const c0 = x1, c1 = .5 * (x2 - x0), c2 = x0 - 2.5 * x1 + 2 * x2 - .5 * x3, c3 = .5 * (x3 - x0) + 1.5 * (x1 - x2);
      return Math.max(0, Math.min(255, Math.round(((c3 * t + c2) * t + c1) * t + c0)));
    });
  },
  bezierInterpolation(src, dst, options) {
    return this._interpolate2D(src, dst, options, function(x0, x1, x2, x3, t) {
      const nt = 1 - t, c0 = x1 * nt * nt * nt, c1 = 3 * (x1 + (x2 - x0) / 4) * nt * nt * t, c2 = 3 * (x2 - (x3 - x1) / 4) * nt * t * t, c3 = x2 * t * t * t;
      return Math.max(0, Math.min(255, Math.round(c0 + c1 + c2 + c3)));
    });
  }
}, ResizeOptionsSchema = unionType([ objectType({
  w: numberType().min(0),
  h: numberType().min(0).optional(),
  mode: nativeEnumType(ResizeStrategy).optional()
}), objectType({
  w: numberType().min(0).optional(),
  h: numberType().min(0),
  mode: nativeEnumType(ResizeStrategy).optional()
}) ]), ScaleToFitOptionsSchema = objectType({
  w: numberType().min(0),
  h: numberType().min(0),
  mode: nativeEnumType(ResizeStrategy).optional()
}), ScaleComplexOptionsSchema = objectType({
  f: numberType().min(0),
  mode: nativeEnumType(ResizeStrategy).optional()
}), methods = {
  resize(image, options) {
    const {mode: mode} = ResizeOptionsSchema.parse(options);
    let w, h;
    if ("number" == typeof options.w) {
      w = options.w, h = options.h ?? image.bitmap.height * (w / image.bitmap.width);
    } else {
      if ("number" != typeof options.h) {
        throw new Error("w must be a number");
      }
      h = options.h, w = options.w ?? image.bitmap.width * (h / image.bitmap.height);
    }
    if (w = Math.round(w) || 1, h = Math.round(h) || 1, mode && "function" == typeof operations[mode]) {
      const dst = {
        data: Buffer.alloc(w * h * 4),
        width: w,
        height: h
      };
      operations[mode](image.bitmap, dst), image.bitmap = dst;
    } else {
      new Resize(image.bitmap.width, image.bitmap.height, w, h, !0, !0, buffer => {
        image.bitmap.data = Buffer.from(buffer), image.bitmap.width = w, image.bitmap.height = h;
      }).resize(image.bitmap.data);
    }
    return image;
  },
  scale(image, options) {
    const {f: f, mode: mode} = "number" == typeof options ? {
      f: options
    } : ScaleComplexOptionsSchema.parse(options), w = image.bitmap.width * f, h = image.bitmap.height * f;
    return this.resize(image, {
      w: w,
      h: h,
      mode: mode
    });
  },
  scaleToFit(image, options) {
    const {h: h, w: w, mode: mode} = ScaleToFitOptionsSchema.parse(options), f = w / h > image.bitmap.width / image.bitmap.height ? h / image.bitmap.height : w / image.bitmap.width;
    return this.scale(image, {
      f: f,
      mode: mode
    });
  }
}, Jimp = createJimp({
  plugins: [ methods ],
  formats: [ jpeg, bmp ]
}), getLibheifFactory = (() => {
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
})(), encodeJpeg = (buffer, w, h) => JPEG.encode({
  width: w,
  height: h,
  data: buffer
}, 80).data, resize = async (buffer, oldSize, newSize) => {
  if (!newSize) {
    return encodeJpeg(buffer, oldSize.w, oldSize.h);
  }
  try {
    const image = await Jimp.fromBuffer(buffer);
    oldSize.w > oldSize.h ? image.resize({
      w: newSize.w
    }) : image.resize({
      h: newSize.h
    });
    return await image.getBuffer("image/jpeg", {
      quality: 80
    });
  } catch {
    return encodeJpeg(buffer, oldSize.w, oldSize.h);
  }
}, convertHEIC = async ({filename: filename, arrayBuffer: arrayBuffer, size: size}) => {
  let heifDecoder, heifImages;
  try {
    Log.debug("[MMM-OneDrive] [convertHEIC]", {
      filename: filename
    });
    const d = Date.now(), inputBuffer = Buffer.from(arrayBuffer);
    if (heifDecoder = new ((await getLibheifFactory()).HeifDecoder), heifImages = await heifDecoder.decode(inputBuffer), 
    !heifImages || 0 === heifImages.length) {
      throw new Error(`No HEIF images found in ${filename}.`);
    }
    const heifImage = heifImages[0], w = heifImage.get_width(), h = heifImage.get_height(), decodedData = await new Promise((resolve, reject) => {
      heifImage.display({
        data: new Uint8ClampedArray(w * h * 4),
        w: w,
        h: h
      }, displayData => {
        if (!displayData) {
          return reject(new Error("HEIF processing error"));
        }
        resolve(displayData);
      });
    }), outputBuffer = await resize(decodedData.data, {
      w: w,
      h: h
    }, size ? {
      w: size.width,
      h: size.height
    } : void 0);
    return Log.debug("[MMM-OneDrive] [convertHEIC] Done", {
      duration: Date.now() - d
    }), outputBuffer;
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

const isJpgFn = buffer => !(!buffer || buffer.length < 3) && (255 === buffer[0] && 216 === buffer[1] && 255 === buffer[2]), urlToImageBase64 = async (photo, size) => {
  const arrayBuf = await fetchToArrayBuffer(photo.baseUrl), imageType$1 = await imageType(arrayBuf);
  if (!imageType$1) {
    throw new FileError(`Could not determine image type for ${photo.filename}`);
  }
  Log.debug(`[MMM-OneDrive] [urlToImageBase64] Image type: ${imageType$1.ext}, mimeType: ${imageType$1.mime}`);
  let buffer = Buffer.from(arrayBuf);
  if ("heic" === imageType$1.ext) {
    buffer = await convertHEIC({
      filename: photo.filename,
      arrayBuffer: arrayBuf,
      size: size
    });
    if (!isJpgFn(buffer)) {
      throw new FileError(`The output of convertHEIC is not a valid JPG:\n                ${photo.filename}, mimeType: ${photo.mimeType}, url: ${photo.baseUrl}`);
    }
  }
  return buffer.toString("base64");
};

exports.urlToImageBase64 = urlToImageBase64;
