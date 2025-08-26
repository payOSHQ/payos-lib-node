export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type FinalRequestOptions<T = undefined> = RequestOptions<T> & { method: HTTPMethod; path: string };

type HeaderValue = string | null | undefined;

export type HeadersLike =
  | Headers
  | readonly HeaderValue[][]
  | Record<string, HeaderValue | readonly HeaderValue[]>
  | undefined
  | null;

export type RequestOptions<T = undefined> = {
  /**
   * The HTTP method for the request.
   */
  method?: HTTPMethod;
  /**
   * The URL path for the request.
   *
   * @example "/v1/path"
   */
  path?: string;
  /**
   * Query parameters to include in the request URL.
   */
  query?: Record<string, any>;
  /**
   * The request body.
   */
  body?: T;
  /**
   * HTTP headers to include with the request.
   */
  headers?: HeadersLike;
  /**
   * The maximum number of times that the client will retry a request.
   *
   * @default 2
   */
  maxRetries?: number;
  /**
   * The maximum amount of time (in milliseconds) that the client should wait for a response
   * from the server before timing out of a request.
   *
   * @unit milliseconds
   */
  timeout?: number;
  /**
   * Additional `RequestInit` options to be passed to the underlying `fetch` call.
   * The options will be merge with the client's default fetch options.
   */
  fetchOptions?: RequestInit;
  signal?: AbortSignal | undefined | null;
  defaultBaseURL?: string | undefined;
  signatureOpts?: {
    request?: 'body' | 'header' | 'create-payment-link';
    response?: 'body' | 'header';
  };
};
