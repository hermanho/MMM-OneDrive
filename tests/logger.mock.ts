import { jest } from "@jest/globals";

const logLevel = {
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  group: jest.fn(),
  groupCollapsed: jest.fn(),
  groupEnd: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
  timeStamp: jest.fn(),
  setLogLevel: jest.fn(),
};

export = logLevel;