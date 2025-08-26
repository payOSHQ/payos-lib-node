export const isRunningInBrowser = () => {
  return (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).window !== 'undefined' &&
    typeof (globalThis as any).window.document !== 'undefined' &&
    typeof (globalThis as any).navigator !== 'undefined'
  );
};

export const getDefaultFetch = () => {
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
  if (g && typeof g.fetch !== 'undefined') {
    return g.fetch;
  }
  throw new Error(
    '`fetch` is not defined as a global; Either pass `fetch` to the client, `new PayOS({ fetch })` or polyfill the global, `globalThis.fetch = fetch`',
  );
};
