const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^logger$": "<rootDir>/tests/logger.mock.js",
    "^node_helper$": "<rootDir>/tests/node_helper.mock.js",
  },
  injectGlobals: false,
};