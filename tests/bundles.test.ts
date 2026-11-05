import { execFileSync } from "node:child_process";
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
});
