import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import pkg from "./package.json" with { type: "json" };
import path from "node:path";

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

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  {
    input: "src/frontend/main.ts",
    external: ["logger", "moment"],
    plugins: [typescript({ tsconfig: "./src/frontend/tsconfig.json" }), nodeResolve({ jail: path.resolve(".") }), commonjs(), terser()],
    output: {
      banner: bannerText,
      file: `./${pkg.main}`,
      format: "iife",
      sourcemap: true,
      globals: {
        logger: "Log",
        moment: "moment",
      },
    },
  },
  ...["lib", "OneDrivePhotos", "DiskCaching"].flatMap((file) => [
    {
      input: `./src/backend/${file}.ts`,
      external: ["node_helper", "logger", "sharp", /node:.*/, /node_modules\/jpeg-js/, /node_modules\/libheif-js/],
      plugins: [typescript({
        tsconfig: "./src/backend/tsconfig.json",
      }),
      nodeResolve({
        preferBuiltins: true,
        browser: false,
        jail: path.resolve("."),
      }), commonjs(), terser({
        mangle: false,
        format: {
          indent_level: 2,
          braces: true,
          beautify: true,
        },
        toplevel: true,
      })],
      output: {
        banner: bannerText,
        file: `./lib/${file}.js`,
        format: "cjs",
        globals: {
          logger: "Log",
        },
      },
    },
    {
      input: `./src/backend/${file}.ts`,
      external: ["node_helper", "logger", "sharp", /node:.*/, /node_modules\/jpeg-js/, /node_modules\/libheif-js/],
      plugins: [dts()],
      output: {
        file: `./lib/${file}.d.ts`,
        globals: {
          logger: "Log",
        },
      },
    },
  ]),
];