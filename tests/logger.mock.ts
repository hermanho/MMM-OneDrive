import { vi } from "vitest";

const logger = {
  debug: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  group: vi.fn(),
  groupCollapsed: vi.fn(),
  groupEnd: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
  timeStamp: vi.fn(),
  setLogLevel: vi.fn(),
};

export default logger;
