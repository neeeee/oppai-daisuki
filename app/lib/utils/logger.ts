/**
 * Lightweight logger utility for Next.js apps.
 *
 * - No-ops in production by default (to satisfy no-console in prod).
 * - Enabled in development (NODE_ENV !== "production"), unless LOG_ENABLED="false".
 * - Can be manually toggled at runtime via setGlobalLoggerEnabled().
 *
 * Usage:
 *   import logger, { createLogger } from "@/app/lib/utils/logger";
 *   logger.info("Hello");              // dev: logs, prod: no-op
 *   const authLog = createLogger("auth");
 *   authLog.warn("Something happened", { detail });
 *
 * For timing:
 *   const end = logger.time("expensive-op");
 *   // ... work ...
 *   end(); // prints duration if enabled
 */

type LogFn = (...args: unknown[]) => void;

export interface Logger {
  readonly enabled: boolean;
  setEnabled(value: boolean): void;

  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  group: (label: string) => void;
  groupEnd: () => void;

  /**
   * Start a timer and return a function that, when called, logs the duration.
   * Example:
   *   const end = logger.time("loadData");
   *   // ... work ...
   *   end(); // "loadData: 34.12ms"
   */
  time: (label: string) => () => void;

  /**
   * Returns a new logger with a fixed prefix attached to every message.
   * Example:
   *   const apiLog = logger.withPrefix("api");
   *   apiLog.info("GET /items", { page });
   */
  withPrefix: (prefix: string) => Logger;
}

const isProd = process.env.NODE_ENV === "production";

// Default behavior:
// - dev: enabled unless explicitly disabled with LOG_ENABLED="false"
// - prod: disabled unless explicitly enabled with LOG_ENABLED="true"
let _enabled =
  (process.env.LOG_ENABLED === "true") ||
  (!isProd && process.env.LOG_ENABLED !== "false");

const noop: LogFn = () => {};
const noopGroup = () => {};
const noopGroupEnd = () => {};
const noopTime = () => () => {};

function fmtPrefix(prefix?: string): string[] {
  return prefix ? [`[${prefix}]`] : [];
}

function createConsoleLogger(prefix?: string): Logger {
  const basePrefix = fmtPrefix(prefix);

  const logWith =
    (method: "debug" | "info" | "warn" | "error"): LogFn =>
    (...args: unknown[]) => {
      if (!_enabled) return;
      const map: Record<"debug" | "info" | "warn" | "error", (...a: unknown[]) => void> = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      };
      map[method](...basePrefix, ...args);
    };

  const startTime =
    (label: string) =>
    () => {
      if (!_enabled) return;
      console.timeEnd([...basePrefix, label].join(" "));
    };

  const time = (label: string) => {
    if (!_enabled) return noopTime();
    console.time([...basePrefix, label].join(" "));
    return startTime(label);
  };

  const group: Logger["group"] = (label: string) => {
    if (!_enabled) return;
    console.group(...basePrefix, label);
  };

  const groupEnd: Logger["groupEnd"] = () => {
    if (!_enabled) return;
    console.groupEnd();
  };

  return {
    get enabled() {
      return _enabled;
    },
    setEnabled(value: boolean) {
      _enabled = Boolean(value);
    },

    debug: logWith("debug"),
    info: logWith("info"),
    warn: logWith("warn"),
    error: logWith("error"),
    group,
    groupEnd,
    time,

    withPrefix(nextPrefix: string) {
      const combined = prefix ? `${prefix}:${nextPrefix}` : nextPrefix;
      return createConsoleLogger(combined);
    },
  };
}

function createNoopLogger(): Logger {
  return {
    get enabled() {
      return _enabled;
    },
    setEnabled(value: boolean) {
      _enabled = Boolean(value);
    },

    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    group: noopGroup,
    groupEnd: noopGroupEnd,
    time: noopTime,
    withPrefix() {
      return createNoopLogger();
    },
  };
}

/**
 * Exported logger instance:
 * - Uses console in development if enabled.
 * - No-ops in production unless LOG_ENABLED="true".
 */
const logger: Logger = isProd && process.env.LOG_ENABLED !== "true"
  ? createNoopLogger()
  : createConsoleLogger();

/**
 * Create a namespaced logger instance.
 * The returned logger will inherit the global enabled/disabled state.
 */
export function createLogger(prefix?: string): Logger {
  if (isProd && process.env.LOG_ENABLED !== "true") {
    return createNoopLogger();
  }
  return createConsoleLogger(prefix);
}

/**
 * Manually enable or disable logging at runtime.
 * Useful for integration tests or local debugging scenarios.
 */
export function setGlobalLoggerEnabled(value: boolean): void {
  _enabled = Boolean(value);
}

export default logger;
