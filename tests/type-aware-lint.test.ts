import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("type-aware lint configuration", () => {
  it("accepts returned promises and rejects typed non-Error rejection reasons", () => {
    const directory = mkdtempSync(join(tmpdir(), "mmm-onedrive-oxlint-"));
    const fixture = join(directory, "fixture.ts");
    const args = [resolve("node_modules/oxlint/bin/oxlint"), "--config", resolve(".oxlintrc.json"), "--deny-warnings", fixture];
    const lint = () => spawnSync(process.execPath, args, { encoding: "utf8" });

    try {
      writeFileSync(join(directory, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "es2022", module: "esnext" } }));
      writeFileSync(fixture, "export async function valid(): Promise<string> { return Promise.resolve('ok'); }\n");
      const valid = lint();
      expect(valid.status, valid.stdout + valid.stderr).toBe(0);

      writeFileSync(fixture, "export function invalid(message: string): Promise<never> { return Promise.reject(message); }\n");
      const invalid = lint();
      expect(invalid.status).toBe(1);
      expect(invalid.stdout + invalid.stderr).toContain("prefer-promise-reject-errors");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
