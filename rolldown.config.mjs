import { dts } from "rolldown-plugin-dts";
import pkg from "./package.json" with { type: "json" };

const bannerText = `/*! *****************************************************************************
  ${pkg.name}
  Version ${pkg.version}

  ${pkg.description}
  Please submit bugs at ${pkg.bugs.url}

  (c) ${pkg.author ? pkg.author : pkg.contributors}
  Licence: ${pkg.license}

  This file is auto-generated. Do not edit.
***************************************************************************** */

`;

const backendExternal = ["node_helper", "logger", "sharp", /node:.*/, /node_modules\/jpeg-js/, /node_modules\/libheif-js/];

/** @type {import('rolldown').RolldownOptions[]} */
export default [
  {
    input: "src/frontend/main.ts",
    external: ["logger"],
    platform: "browser",
    tsconfig: "./src/frontend/tsconfig.json",
    output: {
      banner: bannerText,
      file: `./${pkg.main}`,
      format: "iife",
      codeSplitting: false,
      minify: true,
      sourcemap: true,
      globals: { logger: "Log" },
    },
  },
  ...["lib", "OneDrivePhotos", "DiskCaching"].flatMap((file) => [
    {
      input: `./src/backend/${file}.ts`,
      external: backendExternal,
      platform: "node",
      tsconfig: "./src/backend/tsconfig.json",
      output: {
        banner: bannerText,
        dir: "./lib",
        entryFileNames: "[name].js",
        format: "cjs",
        codeSplitting: false,
        minify: { compress: true, mangle: false },
      },
    },
    {
      input: `./src/backend/${file}.ts`,
      external: [...backendExternal, /^@azure\//, /^@microsoft\//],
      platform: "node",
      plugins: [dts({ tsconfig: "./src/backend/tsconfig.json", emitDtsOnly: true })],
      output: { dir: "./lib", format: "es", codeSplitting: false },
    },
  ]),
];
