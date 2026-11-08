import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("distributed backend bundles", () => {
  it("load as CommonJS and expose the expected entry points", () => {
    const script = `
      const Module = require("node:module");
      const load = Module._load;
      Module._load = function(id, ...args) {
        if (id === "logger") return { info() {}, log() {}, debug() {}, warn() {}, error() {} };
        if (id === "node_helper") return {};
        return load.call(this, id, ...args);
      };
      for (const [file, names] of Object.entries({
        "lib": ["createDirIfNotExists", "createIntervalRunner", "internetStatusListener", "urlToDisk"],
        "OneDrivePhotos": ["OneDrivePhotos"],
        "DiskCaching": ["DiskCaching"],
      })) {
        const bundle = require("./lib/" + file + ".js");
        for (const name of names) if (!(name in bundle)) throw new Error(file + " missing " + name);
      }
    `;
    expect(() => execFileSync(process.execPath, ["-e", script], { cwd: process.cwd() })).not.toThrow();
  });

  it("loads relocated bundles without absolute external imports", () => {
    const directory = mkdtempSync(join(tmpdir(), "mmm-onedrive-bundle-"));
    try {
      cpSync(resolve("lib"), join(directory, "lib"), { recursive: true });
      symlinkSync(resolve("node_modules"), join(directory, "node_modules"), "dir");
      const script = `
        const Module = require("node:module");
        const path = require("node:path");
        const load = Module._load;
        let foundHeif = false;
        Module._load = function(id, parent, ...args) {
          if (parent && path.dirname(parent.filename) === path.join(process.cwd(), "lib")) {
            if (path.isAbsolute(id) || path.win32.isAbsolute(id)) throw new Error("Absolute bundle import: " + id);
            if (id === "libheif-js/libheif-wasm/libheif.js") foundHeif = true;
          }
          if (id === "logger") return { info() {}, log() {}, debug() {}, warn() {}, error() {} };
          if (id === "node_helper") return {};
          return load.call(this, id, parent, ...args);
        };
        for (const file of ["lib", "OneDrivePhotos", "DiskCaching"]) require("./lib/" + file + ".js");
        if (!foundHeif) throw new Error("libheif was not loaded using its package specifier");
      `;
      expect(() => execFileSync(process.execPath, ["-e", script], { cwd: directory })).not.toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
