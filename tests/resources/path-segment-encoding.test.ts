import { PayOS, PayOSError } from '../../src';
import { NodeCryptoProvider } from '../../src/crypto';

describe('Path segment encoding of identifiers', () => {
  const CLIENT_ID = 'test-client-id';
  const API_KEY = 'test-api-key';
  const CHECKSUM_KEY = 'test-checksum-key';
  const BASE_URL = 'https://api-test.payos.vn';
  const RESPONSE_DATA = { id: 'payment-link-id', orderCode: 12345, amount: 2000 };

  const crypto = new NodeCryptoProvider();
  let payos: PayOS;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn(async (url: string) => {
      if (url.endsWith('/download')) {
        return new Response(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        });
      }
      const bodySignature = await crypto.createSignatureFromObj(RESPONSE_DATA, CHECKSUM_KEY);
      const headerSignature = await crypto.createSignature(CHECKSUM_KEY, RESPONSE_DATA);
      return new Response(
        JSON.stringify({ code: '00', desc: 'success', data: RESPONSE_DATA, signature: bodySignature }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'x-signature': headerSignature } },
      );
    });

    payos = new PayOS({
      clientId: CLIENT_ID,
      apiKey: API_KEY,
      checksumKey: CHECKSUM_KEY,
      baseURL: BASE_URL,
      maxRetries: 0,
      fetch: mockFetch,
    });
  });

  // The cases mix strings and numbers on purpose, so each call narrows the id to the declared parameter type.
  type Call = (client: PayOS, id: string | number) => Promise<unknown>;

  // Each public method that interpolates an identifier into its path, with the path built for a given segment.
  const methods: Array<{ name: string; param: string; call: Call; path: (segment: string) => string }> = [
    {
      name: 'paymentRequests.get',
      param: 'id',
      call: (client, id) => client.paymentRequests.get(id as string),
      path: (segment) => `/v2/payment-requests/${segment}`,
    },
    {
      name: 'paymentRequests.cancel',
      param: 'id',
      call: (client, id) => client.paymentRequests.cancel(id as string, 'reason'),
      path: (segment) => `/v2/payment-requests/${segment}/cancel`,
    },
    {
      name: 'paymentRequests.invoices.get (paymentLinkId)',
      param: 'id',
      call: (client, id) => client.paymentRequests.invoices.get({ paymentLinkId: id as string }),
      path: (segment) => `/v2/payment-requests/${segment}/invoices`,
    },
    {
      name: 'paymentRequests.invoices.get (orderCode)',
      param: 'id',
      call: (client, id) => client.paymentRequests.invoices.get({ orderCode: id as number }),
      path: (segment) => `/v2/payment-requests/${segment}/invoices`,
    },
    {
      name: 'paymentRequests.invoices.download (paymentLinkId)',
      param: 'id',
      call: (client, id) =>
        client.paymentRequests.invoices.download('invoice-id', { paymentLinkId: id as string }),
      path: (segment) => `/v2/payment-requests/${segment}/invoices/invoice-id/download`,
    },
    {
      name: 'paymentRequests.invoices.download (orderCode)',
      param: 'id',
      call: (client, id) =>
        client.paymentRequests.invoices.download('invoice-id', { orderCode: id as number }),
      path: (segment) => `/v2/payment-requests/${segment}/invoices/invoice-id/download`,
    },
    {
      name: 'paymentRequests.invoices.download (invoiceId)',
      param: 'invoiceId',
      call: (client, id) =>
        client.paymentRequests.invoices.download(id as string, { paymentLinkId: 'payment-link-id' }),
      path: (segment) => `/v2/payment-requests/payment-link-id/invoices/${segment}/download`,
    },
    {
      name: 'payouts.get',
      param: 'payoutId',
      call: (client, id) => client.payouts.get(id as string),
      path: (segment) => `/v1/payouts/${segment}`,
    },
  ];

  const encodedCases: Array<[string, string | number, string]> = [
    ['a normal id', 'payment-link-id', 'payment-link-id'],
    ['a numeric id', 12345, '12345'],
    ['the largest safe integer', Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER)],
    ['a dot segment prefix', '../x', '..%2Fx'],
    ['a slash', 'a/b', 'a%2Fb'],
    ['a question mark', 'a?b', 'a%3Fb'],
    ['a hash', 'a#b', 'a%23b'],
    ['an already percent-encoded slash (encoded once)', 'a%2Fb', 'a%252Fb'],
  ];

  const rejectedCases: Array<[string, string | number, string]> = [
    ['a single dot', '.', 'must not be a dot segment'],
    ['a double dot', '..', 'must not be a dot segment'],
    ['an empty string', '', 'must be a non-empty string or a safe integer'],
    ['a negative number', -1, 'must be a non-negative safe integer'],
    ['a number above 2^53-1', 2 ** 53, 'must be a non-negative safe integer'],
  ];

  describe.each(methods)('$name', ({ param, call, path }) => {
    it.each(encodedCases)(
      'sends %s as a single path segment',
      async (_label: string, id: string | number, segment: string) => {
        await call(payos, id);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url: string = mockFetch.mock.calls[0][0];
        expect(url).toBe(`${BASE_URL}${path(segment)}`);
        const parsed = new URL(url);
        expect(parsed.pathname).toBe(path(segment));
        expect(parsed.search).toBe('');
        expect(parsed.hash).toBe('');
      },
    );

    it.each(rejectedCases)(
      'rejects %s without sending a request',
      async (_label: string, id: string | number, message: string) => {
        const promise = call(payos, id);

        await expect(promise).rejects.toBeInstanceOf(PayOSError);
        await expect(promise).rejects.toThrow(`${param} ${message}`);
        expect(mockFetch).not.toHaveBeenCalled();
      },
    );
  });
});
