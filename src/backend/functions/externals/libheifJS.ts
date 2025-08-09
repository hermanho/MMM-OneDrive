/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import libheifWASMModule from "libheif-js/libheif-wasm/libheif.js";
import Log from "logger";

export const getLibheifFactory = (() => {
  let _libheifFactory: any = null;

  return async function getLibheifFactory(): Promise<any> {
    if (_libheifFactory) {
      return _libheifFactory;
    }
    Log.info("[MMM-OneDrive] [getLibheifFactory] Loading libheif-js wasm");
    const libheifWasmPath = require.resolve("libheif-js/libheif-wasm/libheif.wasm");
    const wasmBinary = fs.readFileSync(libheifWasmPath);
    const factory = await (libheifWASMModule as any)({ wasmBinary });
    await factory.ready;
    _libheifFactory = factory;
    return factory;
  };
})();
