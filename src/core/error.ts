export class PayOSError extends Error {}

export class APIError<
  TStatus extends number | undefined = number | undefined,
  THeaders extends Headers | undefined = Headers | undefined,
  TError extends object | undefined = object | undefined,
> extends PayOSError {
  readonly status: TStatus;
  readonly headers: THeaders;
  readonly error: TError;

  readonly code: string | null | undefined;
  readonly desc: string | null | undefined;

  constructor(status: TStatus, error: TError, message: string | undefined, headers: THeaders) {
    super(APIError.makeMessage(status, error, message));
    this.status = status;
    this.headers = headers;
    this.error = error;

    const response = error as Record<string, string>;
    this.code = response?.code;
    this.desc = response?.desc;
    Object.defineProperty(this, 'name', { value: new.target.name });
  }

  private static makeMessage(status: number | undefined, error: any, message: string | undefined) {
    let msg: string | undefined;

    if (error?.code && error?.desc) {
      msg = `${error.desc} (code: ${error.code})`;
    } else {
      msg =
        error?.message ?
          typeof error.message === 'string' ?
            error.message
          : JSON.stringify(error.message)
        : error ? JSON.stringify(error)
        : message;
    }

    if (status && msg) {
      return `HTTP ${status}, ${msg}`;
    }
    if (status) {
      return `HTTP ${status}`;
    }
    if (msg) {
      return `${msg}`;
    }
    return 'No status code or body';
  }

  static generateError(
    status: number | undefined,
    errorResponse: object | undefined,
    message: string | undefined,
    headers: Headers | undefined,
  ): APIError {
    if (!status || !headers) {
      return new ConnectionError(message);
    }

    const code = (errorResponse as Record<string, any>)?.['code'];
    const desc = (errorResponse as Record<string, any>)?.['desc'];
    const error = (errorResponse as Record<string, any>)?.['error'] ?? { code, desc };
    switch (status) {
      case 400:
        return new BadRequestError(status, error, message, headers);
      case 401:
        return new UnauthorizedError(status, error, message, headers);
      case 403:
        return new ForbiddenError(status, headers, message, headers);
      case 404:
        return new NotFoundError(status, error, message, headers);
      case 429:
        return new TooManyRequestError(status, error, message, headers);
      default:
        return new APIError(status, error, message, headers);
    }
  }
}

export class UserAbortError extends APIError<undefined, undefined, undefined> {
  constructor(message?: string | undefined) {
    super(undefined, undefined, message || 'Request was abort', undefined);
  }
}

export class ConnectionError extends APIError<undefined, undefined, undefined> {
  constructor(message?: string | undefined) {
    super(undefined, undefined, message || 'Connection error.', undefined);
  }
}

export class ConnectionTimeoutError extends APIError<undefined, undefined, undefined> {
  constructor(message?: string | undefined) {
    super(undefined, undefined, message || 'Request timed out.', undefined);
  }
}

export class BadRequestError extends APIError<400, Headers> {}

export class UnauthorizedError extends APIError<401, Headers> {}

export class ForbiddenError extends APIError<403, Headers> {}

export class NotFoundError extends APIError<404, Headers> {}

export class TooManyRequestError extends APIError<429, Headers> {}

export class InternalServerError extends APIError<number, Headers> {}

export class InvalidSignatureError extends PayOSError {
  constructor(message?: string) {
    super(message);
  }
}

export class WebhookError extends PayOSError {
  constructor(messages?: string) {
    super(messages);
  }
}
