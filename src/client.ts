import { readEnv } from './utils/env';
import { Logger, LogLevel, loggerFor, formatRequestDetail, parseLogLevel } from './utils/log';
import { getDefaultFetch } from './utils/detect-platform';
import { CryptoProvider, createCryptoProvider } from './crypto';
import { PaymentRequests, Payouts, PayoutsAccount, Webhooks } from './resources';
import { CreatePaymentLinkRequest } from './resources/v2/payment-requests';
import { APIResponse, DataType, FileDownloadResponse } from './core/api-response';
import * as Errors from './core/error';
import { castToError } from './utils/error';
import { safeJSON, validatePositiveInteger } from './utils/values';
import { FinalRequestOptions, HeadersLike, HTTPMethod, RequestOptions } from './core/request-options';
import { VERSION } from './version';

const BASE_URL = 'https://api-merchant.payos.vn';

export interface PayOSOptions {
  /**
   * Defaults to process.env['PAYOS_CLIENT_ID'].
   */
  clientId?: string;
  /**
   * Defaults to process.env['PAYOS_API_KEY'].
   */
  apiKey?: string;
  /**
   * Defaults to process.env['PAYOS_CHECKSUM_KEY'].
   */
  checksumKey?: string;
  /**
   * Defaults to process.env['PAYOS_PARTNER_CODE'].
   */
  partnerCode?: string | null | undefined;
  /**
   * Override the default base URL for the API.
   *
   * Defaults to process.env['PAYOS_BASE_URL'].
   */
  baseURL?: string | null | undefined;
  /**
   * Set the logger.
   *
   * Defaults to globalThis.console.
   */
  logger?: Logger | null | undefined;
  /**
   * Set the log level.
   *
   * Defaults to process.env['PAYOS_LOG'] or 'warn' if is isn't set.
   */
  logLevel?: LogLevel | null | undefined;
  /**
   * Additional `RequestInit` options to be passed to `fetch` calls.
   * Properties will be overridden by per-request `fetchOptions`.
   */
  fetchOptions?: RequestInit | null | undefined;
  /**
   * A custom fetch implementation to use for HTTP requests.
   * If not provided, we expected that `fetch` is defined globally.
   */
  fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  /**
   * The maximum amount of time (milliseconds) that the client should wait for a response
   * from the server before timing out a single request.
   *
   * @unit milliseconds
   */
  timeout?: number | null | undefined;
  /**
   * The maximums number of times that the client will retry a request.
   *
   * @default 2
   */
  maxRetries?: number | null | undefined;
}

/**
 * API client for interacting with payOS Merchant API.
 */
export class PayOS {
  apiKey: string;
  clientId: string;
  checksumKey: string;
  partnerCode?: string | null | undefined;
  baseURL: string;
  logger?: Logger | null | undefined;
  logLevel?: LogLevel | null | undefined;
  fetchOptions: RequestInit;
  private fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  timeout: number;
  maxRetries: number;
  crypto: CryptoProvider;

  /**
   * Create a new PayOS API client instance.
   *
   * @param {PayOSOptions} [options] - Client configuration options.
   * @param {string|undefined} [opts.clientId=process.env['PAYOS_CLIENT_ID'] ?? undefined] - Client ID.
   * @param {string|undefined} [opts.apiKey=process.env['PAYOS_API_KEY'] ?? undefined] - API key.
   * @param {string|undefined} [opts.checksumKey=process.env['PAYOS_CHECKSUM_KEY'] ?? undefined] - Checksum key.
   * @param {string|undefined} [opts.partnerCode=process.env['PAYOS_PARTNER_CODE'] ?? undefined] - Partner code.
   * @param {string} [opts.baseURL=process.env['PAYOS_BASE_URL'] ?? https://api-merchant.payos.vn] - Override the default base URL for the API.
   * @param {number} [opts.timeouts=60_000] - The maximum amount of time (in milliseconds) the client will be wait for a response before timing out.
   * @param {RequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
   * @param {Fetch} [opts.fetch] - Specific custom `fetch` function implement.
   * @param {number} [opts.maxRetries=3] - The maximum number of times the client will retry a request.
   */
  constructor({
    clientId = readEnv('PAYOS_CLIENT_ID'),
    apiKey = readEnv('PAYOS_API_KEY'),
    checksumKey = readEnv('PAYOS_CHECKSUM_KEY'),
    partnerCode = readEnv('PAYOS_PARTNER_CODE'),
    baseURL = readEnv('PAYOS_BASE_URL'),
    ...opts
  }: PayOSOptions = {}) {
    if (clientId === undefined) {
      throw new Errors.PayOSError(
        'The PAYOS_CLIENT_ID environment variable is missing or empty; either provide it, or instantiate the PayOS client with a clientId option.',
      );
    }
    this.clientId = clientId;

    if (apiKey === undefined) {
      throw new Errors.PayOSError(
        'The PAYOS_API_KEY environment variable is missing or empty; either provide it, or instantiate the PayOS client with a apiKey option.',
      );
    }
    this.apiKey = apiKey;

    if (checksumKey === undefined) {
      throw new Errors.PayOSError(
        'The PAYOS_CHECKSUM_KEY environment variable is missing or empty; either provide it, or instantiate the PayOS client with a checksumKey option.',
      );
    }
    this.checksumKey = checksumKey;
    this.partnerCode = partnerCode;
    this.baseURL = baseURL ?? BASE_URL;
    this.logger = opts.logger || {
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };
    const defaultLogLevel = 'warn';
    this.logLevel = defaultLogLevel;
    this.logLevel =
      parseLogLevel(opts.logLevel, 'PayOSOptions.logLevel', this) ??
      parseLogLevel(readEnv('PAYOS_LOG'), "process.env['PAYOS_LOG']", this) ??
      defaultLogLevel;
    this.timeout = opts.timeout ?? PayOS.DEFAULT_TIMEOUT;
    this.maxRetries = opts.maxRetries ?? PayOS.MAX_RETRIES;

    this.crypto = createCryptoProvider();

    this.fetchOptions = opts.fetchOptions ?? {};
    this.fetch = opts.fetch ?? getDefaultFetch();
  }

  private getUserAgent() {
    return `${this.constructor.name}/JS ${VERSION}`;
  }

  protected buildHeaders(additionalHeaders?: HeadersLike) {
    const headers: Record<string, any> = {
      'x-client-id': this.clientId,
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': this.getUserAgent(),
    };

    if (this.partnerCode) {
      headers['x-partner-code'] = this.partnerCode;
    }

    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders);
    }
    return headers;
  }

  protected buildUrl(endpoint: string, queries?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);

    if (queries && Object.keys(queries).length > 0) {
      const params = new URLSearchParams();

      Object.keys(queries).forEach((key) => {
        const val = queries[key];
        if (val === undefined) {
          return;
        }
        if (val === null) {
          params.append(key, '');
          return;
        }

        if (Array.isArray(val) || typeof val === 'object') {
          params.append(key, JSON.stringify(val));
        } else {
          params.append(key, String(val));
        }
      });

      // Append params to url
      const qs = params.toString();
      if (qs) {
        url.search = qs;
      }
    }

    return url.toString();
  }

  protected buildBody<T = any>(body: T): any {
    if (
      body &&
      typeof body === 'object' &&
      !(body instanceof (globalThis as any).ReadableStream) &&
      !(body instanceof FormData) &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof Uint8Array) &&
      typeof body !== 'string'
    ) {
      return JSON.stringify(body);
    }
    return body;
  }

  protected makeStatusError(status: number, error: object, message: string | undefined, headers: Headers) {
    return Errors.APIError.generateError(status, error, message, headers);
  }

  private async shouldRetryRequest(response: Response) {
    if (response.status === 408) {
      return true;
    }
    if (response.status === 429) {
      return true;
    }
    if (response.status >= 500) {
      return true;
    }
    return false;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeRequest<TResponse = any, TRequest = any>(
    options: FinalRequestOptions<TRequest>,
    retriesRemaining?: number,
    retryOfRequestLogID?: string,
  ): Promise<TResponse> {
    if (retriesRemaining === undefined) {
      retriesRemaining = options.maxRetries ?? this.maxRetries;
    }
    if ('timeout' in options) {
      validatePositiveInteger('timeout', options.timeout);
    }
    const { path, method = 'GET', body: requestData, query, headers, signatureOpts } = options;
    const logger = loggerFor(this);
    const url = this.buildUrl(path, query);

    // Handle request signing if required
    let body = requestData;
    let requestHeaders = headers;

    // Build signature
    if (signatureOpts?.request && body) {
      let signature: string | null = null;

      switch (signatureOpts.request) {
        case 'create-payment-link':
          signature = await this.crypto.createSignatureOfPaymentRequest(
            body as unknown as DataType<CreatePaymentLinkRequest>,
            this.checksumKey,
          );
          if (!signature) {
            throw new Errors.InvalidSignatureError('Failed to create payment signature');
          }
          body = { ...body, signature };
          break;

        case 'body':
          signature = await this.crypto.createSignatureFromObj(body, this.checksumKey);
          if (!signature) {
            throw new Errors.InvalidSignatureError('Failed to create body signature');
          }
          body = { ...body, signature };
          break;

        case 'header':
          signature = await this.crypto.createSignature(this.checksumKey, body);
          requestHeaders =
            requestHeaders ? { ...requestHeaders, 'x-signature': signature } : { 'x-signature': signature };
          break;

        default:
          throw new Errors.InvalidSignatureError('Invalid signature request type');
      }
    }

    const buildedHeaders = this.buildHeaders(requestHeaders);

    /** Not an API request ID, just for correlating local log entries. */
    const requestLogID = 'log_' + ((Math.random() * (1 << 24)) | 0).toString(16).padStart(6, '0');
    const retryLogStr = retryOfRequestLogID ? `, retry of: ${retryOfRequestLogID}` : '';
    const startTime = Date.now();

    const timeoutSignal = AbortSignal.timeout(options.timeout ?? this.timeout);
    const combinedSignal = options.signal ? AbortSignal.any([timeoutSignal, options.signal]) : timeoutSignal;

    const serializedBody = this.buildBody(body);

    const fetchConfig: RequestInit = {
      method,
      headers: buildedHeaders,
      signal: combinedSignal,
      ...((globalThis as any).ReadableStream &&
        body instanceof (globalThis as any).ReadableStream && { duplex: 'half' }),
      ...(serializedBody && { body: serializedBody }),
      ...((this.fetchOptions as any) ?? {}),
      ...((options.fetchOptions as any) ?? {}),
    };

    logger.debug(
      `[${requestLogID}] sending request`,
      formatRequestDetail({
        url,
        method,
        headers: buildedHeaders,
        options,
        retryOf: retryOfRequestLogID,
        body: serializedBody,
      }),
    );
    if (fetchConfig.signal?.aborted) {
      if (timeoutSignal.aborted) {
        throw new Errors.ConnectionTimeoutError();
      }
      throw new Errors.UserAbortError();
    }

    const response = await this.fetch(url, fetchConfig as any).catch(castToError);
    const headersTime = Date.now();

    if (response instanceof Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (fetchConfig.signal?.aborted && !timeoutSignal.aborted) {
        throw new Errors.UserAbortError();
      }
      const isTimeout = timeoutSignal.aborted;
      if (retriesRemaining) {
        logger.info(`[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - ${retryMessage}`);
        logger.debug(
          `[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - ${retryMessage}`,
          formatRequestDetail({
            url,
            message: response.message,
            durationMs: headersTime - startTime,
            retryOf: retryOfRequestLogID,
          }),
        );
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      logger.info(
        `[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - error; no more retries left.`,
      );
      logger.debug(
        `[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - error; no more retries left.`,
        formatRequestDetail({
          url,
          durationMs: headersTime - startTime,
          message: response.message,
          retryOf: retryOfRequestLogID,
        }),
      );
      if (isTimeout) {
        throw new Errors.ConnectionTimeoutError();
      }
      throw new Errors.ConnectionError();
    }

    const responseInfo = `[${requestLogID}${retryLogStr}] ${method} ${url} ${
      response.ok ? 'succeeded' : 'failed'
    } with status ${response.status} in ${headersTime - startTime}ms`;

    if (!response.ok) {
      const shouldRetry = await this.shouldRetryRequest(response);
      if (retriesRemaining && shouldRetry) {
        const retryMsg = `retrying, ${retriesRemaining} attempts remaining`;
        logger.info(`${responseInfo} - ${retryMsg}`);
        logger.debug(
          `[${requestLogID}] response error (${retryMsg})`,
          formatRequestDetail({
            url: response.url,
            status: response.status,
            headers: response.headers,
            durationMs: headersTime - startTime,
            retryOf: retryOfRequestLogID,
          }),
        );
        return this.retryRequest(
          options,
          retriesRemaining,
          retryOfRequestLogID ?? requestLogID,
          response.headers,
        );
      }
      const retryMessage = shouldRetry ? 'error; no more retries left' : 'error: cannot retry';
      logger.info(`${responseInfo} - ${retryMessage}`);
      const errText = await response.text().catch((err) => castToError(err).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? undefined : errText;
      logger.debug(
        `[${requestLogID}] response error (${retryMessage})`,
        formatRequestDetail({
          url: response.url,
          status: response.status,
          headers: response.headers,
          message: errMessage,
          durationMs: Date.now() - startTime,
          retryOf: retryOfRequestLogID,
        }),
      );
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }

    const rawJson = await response.json();
    const { data, code, desc, signature } = rawJson as APIResponse<TResponse>;

    if (code !== '00' || !data) {
      throw this.makeStatusError(response.status, { data, code, desc, signature }, desc, response.headers);
    }

    // Build response signature
    if (signatureOpts?.response) {
      const resSignature =
        signatureOpts.response === 'body' ? signature : response.headers.get('x-signature');

      if (resSignature && data) {
        const signedSignature =
          signatureOpts.response === 'body' ?
            await this.crypto.createSignatureFromObj(data, this.checksumKey)
          : await this.crypto.createSignature(this.checksumKey, data);

        if (resSignature !== signedSignature) {
          throw new Errors.InvalidSignatureError('Data integrity check failed');
        }
      }
    }

    return data;
  }

  private async retryRequest<TRequest = any, TResponse = any>(
    options: FinalRequestOptions<TRequest>,
    retriesRemaining: number,
    retryOfRequestLogID: string,
    responseHeaders?: Headers | undefined,
  ) {
    let timeoutMs: number | undefined;
    const retryAfter = responseHeaders?.get('retry-after');
    const rateLimitReset = responseHeaders?.get('x-ratelimit-reset');

    // About the Retry-After header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
    if (retryAfter) {
      const timeoutSecond = parseFloat(retryAfter);
      if (!Number.isNaN(timeoutSecond)) {
        timeoutMs = timeoutSecond * 1000;
      } else {
        timeoutMs = Date.parse(retryAfter) - Date.now();
      }
    }
    if (rateLimitReset) {
      const timeoutSecond = parseFloat(rateLimitReset);
      if (!Number.isNaN(timeoutSecond)) {
        timeoutMs = timeoutSecond * 1000 - Date.now();
      }
    }

    if (!(timeoutMs && timeoutMs >= 0 && timeoutMs < 60 * 1000)) {
      const initRetryDelay = 0.5;
      const maxRetryDelay = 10.0;
      const numRetries = options.maxRetries ?? this.maxRetries - retriesRemaining;
      const sleepSeconds = Math.min(initRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
      // Apply some jitter to avoid thunder herd
      const jitter = 1 - Math.random() * 0.25;
      timeoutMs = sleepSeconds * jitter * 1000;
    }

    await this.sleep(timeoutMs);
    return this.executeRequest<TResponse, TRequest>(options, retriesRemaining - 1, retryOfRequestLogID);
  }

  private async executeFileDownload<TRequest = any>(
    options: Omit<FinalRequestOptions<TRequest>, 'responseType' | 'signatureOpts'>,
    retriesRemaining?: number,
    retryOfRequestLogID?: string,
  ): Promise<FileDownloadResponse> {
    if (retriesRemaining === undefined) {
      retriesRemaining = options.maxRetries ?? this.maxRetries;
    }
    if ('timeout' in options) {
      validatePositiveInteger('timeout', options.timeout);
    }
    const { path, method = 'GET', body, query, headers } = options;
    const logger = loggerFor(this);
    const url = this.buildUrl(path, query);

    const buildedHeaders = this.buildHeaders(headers);

    /** Not an API request ID, just for correlating local log entries. */
    const requestLogID = 'log_' + ((Math.random() * (1 << 24)) | 0).toString(16).padStart(6, '0');
    const retryLogStr = retryOfRequestLogID ? `, retry of: ${retryOfRequestLogID}` : '';
    const startTime = Date.now();

    const timeoutSignal = AbortSignal.timeout(options.timeout ?? this.timeout);
    const combinedSignal = options.signal ? AbortSignal.any([timeoutSignal, options.signal]) : timeoutSignal;

    const serializedBody = this.buildBody(body);

    const fetchConfig: RequestInit = {
      method,
      headers: buildedHeaders,
      signal: combinedSignal,
      ...((globalThis as any).ReadableStream &&
        body instanceof (globalThis as any).ReadableStream && { duplex: 'half' }),
      ...(serializedBody && { body: serializedBody }),
      ...((this.fetchOptions as any) ?? {}),
      ...((options.fetchOptions as any) ?? {}),
    };

    logger.debug(
      `[${requestLogID}${retryLogStr}] sending file download request`,
      formatRequestDetail({
        url,
        method,
        headers: buildedHeaders,
        options,
        retryOf: retryOfRequestLogID,
        body: serializedBody,
      }),
    );

    if (fetchConfig.signal?.aborted) {
      if (timeoutSignal.aborted) {
        throw new Errors.ConnectionTimeoutError();
      }
      throw new Errors.UserAbortError();
    }

    const response = await this.fetch(url, fetchConfig as any).catch(castToError);
    const headersTime = Date.now();

    if (response instanceof Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (fetchConfig.signal?.aborted && !timeoutSignal.aborted) {
        throw new Errors.UserAbortError();
      }
      const isTimeout = timeoutSignal.aborted;
      if (retriesRemaining) {
        logger.info(`[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - ${retryMessage}`);
        logger.debug(
          `[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - ${retryMessage}`,
          formatRequestDetail({
            url,
            durationMs: headersTime - startTime,
            message: response.message,
            retryOf: retryOfRequestLogID,
          }),
        );
        return this.retryDownloadFile(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      logger.info(
        `[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - error; no more retries left.`,
      );
      logger.debug(
        `[${requestLogID}] connection ${isTimeout ? 'timeout' : 'failed'} - error; no more retries left.`,
        formatRequestDetail({
          url,
          durationMs: headersTime - startTime,
          message: response.message,
          retryOf: retryOfRequestLogID,
        }),
      );
      if (isTimeout) {
        throw new Errors.ConnectionTimeoutError();
      }
      throw new Errors.ConnectionError();
    }

    const responseInfo = `[${requestLogID}] ${method} ${url} ${
      response.ok ? 'succeeded' : 'failed'
    } with status ${response.status} in ${headersTime - startTime}ms`;

    if (!response.ok) {
      const shouldRetry = await this.shouldRetryRequest(response);
      if (retriesRemaining && shouldRetry) {
        const retryMsg = `retrying, ${retriesRemaining} attempts remaining`;
        logger.info(`${responseInfo} - ${retryMsg}`);
        logger.debug(
          `[${requestLogID}] response error (${retryMsg})`,
          formatRequestDetail({
            url: response.url,
            status: response.status,
            headers: response.headers,
            durationMs: headersTime - startTime,
            retryOf: retryOfRequestLogID,
          }),
        );
        return this.retryDownloadFile(
          options,
          retriesRemaining,
          retryOfRequestLogID ?? requestLogID,
          response.headers,
        );
      }
      const retryMessage = shouldRetry ? 'error; no more retries left' : 'error: cannot retry';
      logger.info(`${responseInfo} - ${retryMessage}`);
      const errText = await response.text().catch((err) => castToError(err).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? undefined : errText;
      logger.debug(
        `[${requestLogID}] response error (${retryMessage})`,
        formatRequestDetail({
          url: response.url,
          status: response.status,
          headers: response.headers,
          message: errMessage,
          durationMs: Date.now() - startTime,
          retryOf: retryOfRequestLogID,
        }),
      );
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      const rawJson = await response.json();
      const { code, desc } = rawJson as APIResponse<undefined>;
      throw this.makeStatusError(response.status, { code, desc }, desc, response.headers);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');

    let filename: string | undefined;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    return {
      filename,
      contentType,
      size: contentLength ? parseInt(contentLength, 10) : undefined,
      data: arrayBuffer,
    };
  }

  private async retryDownloadFile<TRequest = any>(
    options: Omit<FinalRequestOptions<TRequest>, 'responseType' | 'signatureOpts'>,
    retriesRemaining: number,
    retryOfRequestLogID: string,
    responseHeaders?: Headers | undefined,
  ) {
    let timeoutMs: number | undefined;
    const retryAfter = responseHeaders?.get('retry-after');
    const rateLimitReset = responseHeaders?.get('x-ratelimit-reset');

    // About the Retry-After header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
    if (retryAfter) {
      const timeoutSecond = parseFloat(retryAfter);
      if (!Number.isNaN(timeoutSecond)) {
        timeoutMs = timeoutSecond * 1000;
      } else {
        timeoutMs = Date.parse(retryAfter) - Date.now();
      }
    }
    if (rateLimitReset) {
      const timeoutSecond = parseFloat(rateLimitReset);
      if (!Number.isNaN(timeoutSecond)) {
        timeoutMs = timeoutSecond * 1000;
      }
    }

    if (!(timeoutMs && timeoutMs >= 0 && timeoutMs < 60 * 1000)) {
      const initRetryDelay = 0.5;
      const maxRetryDelay = 10.0;
      const numRetries = options.maxRetries ?? this.maxRetries - retriesRemaining;
      const sleepSeconds = Math.min(initRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
      // Apply some jitter to avoid thunder herd
      const jitter = 1 - Math.random() * 0.25;
      timeoutMs = sleepSeconds * jitter * 1000;
    }

    await this.sleep(timeoutMs);
    return this.executeFileDownload<TRequest>(options, retriesRemaining - 1, retryOfRequestLogID);
  }

  get<TResponse = any, TRequest = any>(path: string, options?: RequestOptions<TRequest>) {
    return this.methodRequest<TResponse, TRequest>('GET', path, options);
  }

  post<TResponse = any, TRequest = any>(path: string, options?: RequestOptions<TRequest>) {
    return this.methodRequest<TResponse, TRequest>('POST', path, options);
  }

  patch<TResponse = any, TRequest = any>(path: string, options?: RequestOptions<TRequest>) {
    return this.methodRequest<TResponse, TRequest>('PATCH', path, options);
  }

  put<TResponse = any, TRequest = any>(path: string, options?: RequestOptions<TRequest>) {
    return this.methodRequest<TResponse, TRequest>('PUT', path, options);
  }

  delete<TResponse = any, TRequest = any>(path: string, options?: RequestOptions<TRequest>) {
    return this.methodRequest<TResponse, TRequest>('DELETE', path, options);
  }

  private methodRequest<TResponse = any, TRequest = any>(
    method: HTTPMethod,
    path: string,
    options?: RequestOptions<TRequest>,
  ) {
    return this.request<TResponse, TRequest>({ method, path, ...options });
  }

  async request<TResponse = any, TRequest = any>(
    options: FinalRequestOptions<TRequest>,
    remainingRetries: number | undefined = undefined,
  ): Promise<TResponse> {
    return this.executeRequest(options, remainingRetries);
  }

  async downloadFile<TRequest = any>(
    options: Omit<FinalRequestOptions<TRequest>, 'responseType' | 'signatureOpts'>,
    remainingRetries: number | undefined = undefined,
  ): Promise<FileDownloadResponse> {
    return this.executeFileDownload(options, remainingRetries);
  }

  static PayOS = this;
  static DEFAULT_TIMEOUT = 60_000;
  static MAX_RETRIES = 2;

  static PayOSError = Errors.PayOSError;
  static APIError = Errors.APIError;
  static UserAbortError = Errors.UserAbortError;
  static ConnectionError = Errors.ConnectionError;
  static ConnectionTimeoutError = Errors.ConnectionTimeoutError;
  static BadRequestError = Errors.BadRequestError;
  static UnauthorizedError = Errors.UnauthorizedError;
  static ForbiddenError = Errors.ForbiddenError;
  static NotFoundError = Errors.NotFoundError;
  static TooManyRequest = Errors.TooManyRequestError;
  static InternalServerError = Errors.InternalServerError;
  static InvalidSignatureError = Errors.InvalidSignatureError;
  static WebhookError = Errors.WebhookError;

  webhooks: Webhooks = new Webhooks(this);
  paymentRequests: PaymentRequests = new PaymentRequests(this);
  payouts: Payouts = new Payouts(this);
  payoutsAccount: PayoutsAccount = new PayoutsAccount(this);
}
