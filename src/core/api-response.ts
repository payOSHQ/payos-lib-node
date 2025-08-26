export type DataType<T> = T | null | undefined;

export type HeadersType = {
  'x-client-id': string;
  'x-api-key': string;
  'Content-Type': string;
  'x-partner-code'?: string;
};

export type APIResponse<T> = {
  code: string;
  desc: string;
  data?: DataType<T>;
  signature?: string;
};

export type FileDownloadResponse = {
  filename?: string;
  contentType: string;
  size?: number;
  data: ArrayBuffer;
};
