/*! *****************************************************************************
  mmm-onedrive
  Version 1.6.0

  MagicMirror² module to display your photos from OneDrive.
  Please submit bugs at https://github.com/hermanho/MMM-OneDrive/issues

  (c) hermanho
  Licence: MIT

  This file is auto-generated. Do not edit.
***************************************************************************** */

"use strict";

var path = require("node:path"), fs = require("node:fs/promises");

exports.DiskCaching = class {
  dir;
  cleanupRunner;
  fileList;
  constructor(dir, interval = 3e5) {
    this.dir = dir, this.fileList = [], this.cleanupRunner = function(render, interval) {
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
    }(() => this.cleanup(), interval), console.info(`[DiskCaching] Initialized in directory: ${dir}`);
  }
  stop() {
    this.cleanupRunner.stop();
  }
  resume() {
    this.cleanupRunner.resume();
  }
  async cleanup() {
    const listCount = this.fileList.length;
    if (listCount <= 3) {
      return;
    }
    const fileList = this.fileList.splice(0, listCount - 3);
    let count = 0;
    for (const file of fileList) {
      const filePath = path.join(this.dir, file);
      try {
        if (!(await fs.stat(filePath)).isFile()) {
          continue;
        }
        await fs.unlink(filePath), count++;
      } catch (err) {
        console.error(`[DiskCaching] Could not delete file: ${filePath}`, err);
      }
    }
    console.info(`[DiskCaching] Cleanup completed, deleted ${count} / ${listCount} files.`);
  }
  async removeAll() {
    this.fileList.length = 0;
    const files = await fs.readdir(this.dir);
    for (const file of files) {
      const filePath = path.join(this.dir, file);
      try {
        if (!(await fs.stat(filePath)).isFile()) {
          continue;
        }
        await fs.unlink(filePath);
      } catch {}
    }
  }
  push(filePath) {
    this.fileList.push(filePath);
  }
};
