import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      logger: fileURLToPath(new URL("./tests/logger.mock.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: false,
  },
});
