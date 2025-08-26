import { PayOS } from '../client';
import { FinalRequestOptions, HeadersLike } from '../core/request-options';
import { hasOwn } from './values';

type LogFn = (message: string, ...rest: unknown[]) => void;

export type Logger = {
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
};

export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug';

const levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500,
};

function noop() {}

const noopLogger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
};

function makeLogFn(fnLevel: keyof Logger, logger: Logger | undefined, logLevel: LogLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  }
  return logger[fnLevel].bind(logger);
}

const cachedLoggers = /* @__PURE__ */ new WeakMap<Logger, [LogLevel, Logger]>();

export function loggerFor(client: PayOS): Logger {
  const logger = client.logger;
  const logLevel = client.logLevel ?? 'off';
  if (!logger) {
    return noopLogger;
  }

  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }

  const levelLogger = {
    error: makeLogFn('error', logger, logLevel),
    warn: makeLogFn('warn', logger, logLevel),
    info: makeLogFn('info', logger, logLevel),
    debug: makeLogFn('debug', logger, logLevel),
  };

  cachedLoggers.set(logger, [logLevel, levelLogger]);

  return levelLogger;
}

export const parseLogLevel = (
  maybeLevel: LogLevel | string | null | undefined,
  sourceName: string,
  client: PayOS,
): LogLevel | undefined => {
  if (!maybeLevel) {
    return undefined;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client).warn(
    `${sourceName} was set to ${JSON.stringify(
      maybeLevel,
    )}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`,
  );
  return undefined;
};

export const formatRequestDetail = <T = undefined>(config: {
  options?: FinalRequestOptions<T>;
  headers?: HeadersLike;
  url?: string | undefined;
  status?: number | undefined;
  method?: string | undefined;
  durationMs?: number | undefined;
  message?: unknown;
  body?: unknown;
  retryOf?: string | undefined;
}) => {
  if (config.headers) {
    const sanitizedHeaders = Object.fromEntries(
      Object.entries(config.headers).map(([key, value]) => [
        key,
        (
          key.toLowerCase() === 'authorization' ||
          key.toLowerCase() === 'cookie' ||
          key.toLowerCase() === 'set-cookie' ||
          key.toLowerCase() === 'x-client-id' ||
          key.toLowerCase() === 'x-api-key'
        ) ?
          '***'
        : value,
      ]),
    );

    config.headers = sanitizedHeaders;
  }

  return config;
};
