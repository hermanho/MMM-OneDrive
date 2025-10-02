import path from "node:path";
import { createIntervalRunner, IntervalRunner } from "./intervalRunner";
import fs from "node:fs/promises";

export class DiskCaching {
  readonly cleanupRunner: IntervalRunner;
  readonly fileList: string[];

  // Keep the last 3 files, delete older ones every interval (default 5 minutes)
  constructor(readonly dir: string, interval = 1000 * 60 * 5) {
    this.fileList = [];
    this.cleanupRunner = createIntervalRunner(() => this.cleanup(), interval);
    console.info(`[DiskCaching] Initialized in directory: ${dir}`);
  }

  stop() {
    this.cleanupRunner.stop();
  }

  resume() {
    this.cleanupRunner.resume();
  }

  private async cleanup() {
    // Delete all files expect last 3 in the fileList
    const listCount = this.fileList.length;
    if (listCount <= 3) {
      return;
    }
    const fileList = this.fileList.splice(0, listCount - 3);
    let count = 0;
    for (const file of fileList) {
      const filePath = path.join(this.dir, file);
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
          continue;
        }
        await fs.unlink(filePath);
        count++;
      } catch (err) {
        console.error(`[DiskCaching] Could not delete file: ${filePath}`, err);
        // File does not exist or could not be deleted, ignore
      }
    }
    console.info(`[DiskCaching] Cleanup completed, deleted ${count} / ${listCount} files.`);
  }

  async removeAll() {
    this.fileList.length = 0;
    // Delete all files in the directory
    const files = await fs.readdir(this.dir);
    for (const file of files) {
      const filePath = path.join(this.dir, file);
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
          continue;
        }
        await fs.unlink(filePath);
      } catch {
        // File does not exist or could not be deleted, ignore
      }
    }
  }

  push(filePath: string) {
    this.fileList.push(filePath);
  }
}