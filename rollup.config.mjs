import banner2 from "rollup-plugin-banner2";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
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

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  {
    input: "src/frontend/main.ts",
    external: ["logger", "moment"],
    plugins: [typescript({ tsconfig: "./src/frontend/tsconfig.json" }), nodeResolve(), commonjs(), terser(), banner2(() => bannerText)],
    output: {
      file: `./${pkg.main}`,
      format: "iife",
      sourcemap: true,
      globals: {
        logger: "Log",
        moment: "moment",
      },
    },
  },
  {
    input: "./src/backend/lib.ts",
    external: ["node_helper", "logger", /node_modules\/jpeg-js/, /node_modules\/libheif-js/],
    plugins: [typescript({
      tsconfig: "./src/backend/tsconfig.json",
    }), nodeResolve({
      preferBuiltins: true,
      browser: false,
    }), commonjs(), terser({
      mangle: false,
      format: {
        indent_level: 2,
        braces: true,
        beautify: true,
      },
      toplevel: true,
    }), banner2(() => bannerText)],
    output: {
      file: "./lib/lib.js",
      format: "cjs",
      globals: {
        logger: "Log",
      },
    },
  },
  {
    input: "./src/backend/lib.ts",
    external: ["node_helper", "logger", /node_modules\/jpeg-js/, /node_modules\/libheif-js/],
    plugins: [dts()],
    output: {
      file: "./lib/lib.d.ts",
      globals: {
        logger: "Log",
      },
    },
  },
];