import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { PayOS, PayOSError, APIError, type PayOSOptions } from '../src';
import * as dp from '../src/utils/detect-platform';

const CLIENT_ID = 'test-client-id';
const API_KEY = 'test-api-key';
const CHECKSUM_KEY = 'test-checksum-key';
const PARTNER_CODE = 'test-partner-code';
const BASE_URL = 'https://api-test.payos.vn';

const CREDENTIAL_HEADERS = [
  'x-api-key',
  'x-client-id',
  'x-partner-code',
  'authorization',
  'cookie',
  'proxy-authorization',
];

// Extra request headers, in mixed case, so every credential header is present on the first hop.
const EXTRA_HEADERS = {
  Authorization: 'Bearer test-token',
  Cookie: 'session=test-session',
  'Proxy-Authorization': 'Basic dGVzdDp0ZXN0',
  'X-Request-Tag': 'tag-1',
};

const RESULT = { id: 'result-id' };

type Hop = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  redirect: RequestInit['redirect'];
};

const ok = () =>
  new Response(JSON.stringify({ code: '00', desc: 'success', data: RESULT }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const redirectTo = (status: number, location: string) => () =>
  new Response(null, { status, headers: { Location: location } });

const createFetch = (routes: Record<string, () => Response>) => {
  const hops: Hop[] = [];
  const fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    hops.push({
      url,
      method: init?.method ?? 'GET',
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: init?.body,
      redirect: init?.redirect,
    });
    const route = routes[url];
    if (!route) {
      throw new Error(`no route for ${url}`);
    }
    return route();
  });
  return { fetch, hops };
};

const createClient = (fetch: NonNullable<PayOSOptions['fetch']>, fetchOptions?: RequestInit) =>
  new PayOS({
    clientId: CLIENT_ID,
    apiKey: API_KEY,
    checksumKey: CHECKSUM_KEY,
    partnerCode: PARTNER_CODE,
    baseURL: BASE_URL,
    maxRetries: 0,
    fetch,
    ...(fetchOptions && { fetchOptions }),
  });

const expectCredentialHeaders = (hop: Hop) => {
  expect(hop.headers).toMatchObject({
    'x-api-key': API_KEY,
    'x-client-id': CLIENT_ID,
    'x-partner-code': PARTNER_CODE,
    authorization: EXTRA_HEADERS.Authorization,
    cookie: EXTRA_HEADERS.Cookie,
    'proxy-authorization': EXTRA_HEADERS['Proxy-Authorization'],
  });
};

const expectNoCredentialHeaders = (hop: Hop) => {
  for (const name of CREDENTIAL_HEADERS) {
    expect(hop.headers).not.toHaveProperty(name);
  }
};

describe('PayOS Client redirect handling', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('origin changes', () => {
    it.each([
      ['host', 'https://other.payos.test/v1/next'],
      ['scheme', 'http://api-test.payos.vn/v1/next'],
      ['port', 'https://api-test.payos.vn:8443/v1/next'],
    ])('cross-origin redirect (different %s) removes credential headers', async (_label, target) => {
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/start`]: redirectTo(302, target),
        [target]: ok,
      });
      const payos = createClient(fetch);

      await expect(payos.get('/v1/start', { headers: EXTRA_HEADERS })).resolves.toEqual(RESULT);

      expect(hops.map((hop) => hop.url)).toEqual([`${BASE_URL}/v1/start`, target]);
      expect(hops[0].redirect).toBe('manual');
      expectCredentialHeaders(hops[0]);
      expectNoCredentialHeaders(hops[1]);
      expect(hops[1].headers['x-request-tag']).toBe('tag-1');
      expect(hops[1].headers['user-agent']).toBe(hops[0].headers['user-agent']);
    });

    it('same-origin redirect keeps credential headers', async () => {
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/start`]: redirectTo(302, '/v1/next?page=2'),
        [`${BASE_URL}/v1/next?page=2`]: ok,
      });
      const payos = createClient(fetch);

      await expect(payos.get('/v1/start', { headers: EXTRA_HEADERS })).resolves.toEqual(RESULT);

      expect(hops.map((hop) => hop.url)).toEqual([`${BASE_URL}/v1/start`, `${BASE_URL}/v1/next?page=2`]);
      expectCredentialHeaders(hops[0]);
      expectCredentialHeaders(hops[1]);
    });

    it('credential headers removed on a cross-origin hop stay removed when returning to the original origin', async () => {
      const other = 'https://other.payos.test/v1/middle';
      const back = `${BASE_URL}/v1/end`;
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/start`]: redirectTo(302, other),
        [other]: redirectTo(302, back),
        [back]: ok,
      });
      const payos = createClient(fetch);

      await expect(payos.get('/v1/start', { headers: EXTRA_HEADERS })).resolves.toEqual(RESULT);

      expect(hops.map((hop) => hop.url)).toEqual([`${BASE_URL}/v1/start`, other, back]);
      expectCredentialHeaders(hops[0]);
      expectNoCredentialHeaders(hops[1]);
      expectNoCredentialHeaders(hops[2]);
    });

    it('cross-origin redirect of an invoice download removes credential headers', async () => {
      const target = 'https://files.payos.test/invoice.pdf';
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v2/payment-requests/payment-link-id/invoices/invoice-id/download`]: redirectTo(
          302,
          target,
        ),
        [target]: () =>
          new Response(new Uint8Array([37, 80, 68, 70]), {
            status: 200,
            headers: { 'Content-Type': 'application/pdf' },
          }),
      });
      const payos = createClient(fetch);

      const file = await payos.paymentRequests.invoices.download('invoice-id', {
        paymentLinkId: 'payment-link-id',
      });

      expect(file.contentType).toBe('application/pdf');
      expect(hops).toHaveLength(2);
      expect(hops[0].headers['x-api-key']).toBe(API_KEY);
      expect(hops[0].headers['x-partner-code']).toBe(PARTNER_CODE);
      expectNoCredentialHeaders(hops[1]);
    });
  });

  describe('method and body', () => {
    const BODY = { name: 'item' };
    const SERIALIZED_BODY = JSON.stringify(BODY);

    it.each([
      [303, 'POST'],
      [303, 'PUT'],
      [301, 'POST'],
      [302, 'POST'],
    ] as const)('%i answering %s switches to GET without body and Content-Type', async (status, method) => {
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/items`]: redirectTo(status, '/v1/items/1'),
        [`${BASE_URL}/v1/items/1`]: ok,
      });
      const payos = createClient(fetch);

      await expect(payos.request({ method, path: '/v1/items', body: BODY })).resolves.toEqual(RESULT);

      expect(hops[0].method).toBe(method);
      expect(hops[0].body).toBe(SERIALIZED_BODY);
      expect(hops[0].headers['content-type']).toBe('application/json');
      expect(hops[1].method).toBe('GET');
      expect(hops[1].body).toBeUndefined();
      expect(hops[1].headers).not.toHaveProperty('content-type');
      expect(hops[1].headers['x-api-key']).toBe(API_KEY);
    });

    it.each([
      [307, 'POST'],
      [308, 'POST'],
      [301, 'PUT'],
      [302, 'PUT'],
    ] as const)('%i answering %s keeps method, body and Content-Type', async (status, method) => {
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/items`]: redirectTo(status, '/v1/items/1'),
        [`${BASE_URL}/v1/items/1`]: ok,
      });
      const payos = createClient(fetch);

      await expect(payos.request({ method, path: '/v1/items', body: BODY })).resolves.toEqual(RESULT);

      expect(hops[1].method).toBe(method);
      expect(hops[1].body).toBe(SERIALIZED_BODY);
      expect(hops[1].headers['content-type']).toBe('application/json');
    });
  });

  describe('redirect limit', () => {
    const chain = (redirects: number) => {
      const routes: Record<string, () => Response> = {};
      for (let i = 0; i < redirects; i++) {
        routes[`${BASE_URL}/v1/hop/${i}`] = redirectTo(302, `/v1/hop/${i + 1}`);
      }
      routes[`${BASE_URL}/v1/hop/${redirects}`] = ok;
      return routes;
    };

    it('follows up to 5 redirects', async () => {
      const { fetch, hops } = createFetch(chain(5));
      const payos = createClient(fetch);

      await expect(payos.get('/v1/hop/0')).resolves.toEqual(RESULT);
      expect(hops).toHaveLength(6);
    });

    const createDefaultRetryClient = (fetch: NonNullable<PayOSOptions['fetch']>) =>
      new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        partnerCode: PARTNER_CODE,
        baseURL: BASE_URL,
        fetch,
      });

    it('fails after more than 5 redirects without retrying', async () => {
      const { fetch, hops } = createFetch(chain(6));
      const payos = createDefaultRetryClient(fetch);

      const error = await payos.get('/v1/hop/0').catch((err: unknown) => err);

      expect(error).toBeInstanceOf(PayOSError);
      expect((error as Error).message).toContain('Too many redirects (more than 5)');
      expect(fetch).toHaveBeenCalledTimes(6);
      expect(hops.map((hop) => hop.url)).not.toContain(`${BASE_URL}/v1/hop/6`);
    });

    it('fails an invoice download after more than 5 redirects without retrying', async () => {
      const start = `${BASE_URL}/v2/payment-requests/payment-link-id/invoices/invoice-id/download`;
      const routes: Record<string, () => Response> = { [start]: redirectTo(302, '/v1/hop/1') };
      for (let i = 1; i < 7; i++) {
        routes[`${BASE_URL}/v1/hop/${i}`] = redirectTo(302, `/v1/hop/${i + 1}`);
      }
      const { fetch } = createFetch(routes);
      const payos = createDefaultRetryClient(fetch);

      const error = await payos.paymentRequests.invoices
        .download('invoice-id', { paymentLinkId: 'payment-link-id' })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(PayOSError);
      expect((error as Error).message).toContain('Too many redirects (more than 5)');
      expect(fetch).toHaveBeenCalledTimes(6);
    });

    it('cancels the body of the last redirect response', async () => {
      const cancel = jest.fn(async () => {});
      const routes = chain(6);
      routes[`${BASE_URL}/v1/hop/5`] = () => {
        const response = redirectTo(302, '/v1/hop/6')();
        Object.defineProperty(response, 'body', { value: { cancel } });
        return response;
      };
      const { fetch } = createFetch(routes);
      const payos = createClient(fetch);

      await expect(payos.get('/v1/hop/0')).rejects.toBeInstanceOf(PayOSError);
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('redirect statuses', () => {
    it.each([300, 304, 305, 306, 399])('%i with a Location header is not followed', async (status) => {
      const target = `${BASE_URL}/v1/next`;
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/start`]: () =>
          new Response(status === 304 ? null : '', { status, headers: { Location: target } }),
        [target]: ok,
      });
      const payos = createClient(fetch);

      await expect(payos.get('/v1/start')).rejects.toBeInstanceOf(APIError);
      expect(hops).toHaveLength(1);
    });
  });

  describe('caller-supplied header shapes', () => {
    const target = 'https://other.payos.test/v1/next';
    const credentialPairs: [string, string][] = [
      ['X-Api-Key', API_KEY],
      ['Authorization', EXTRA_HEADERS.Authorization],
      ['Cookie', EXTRA_HEADERS.Cookie],
      ['X-Request-Tag', 'tag-1'],
    ];
    const shapes: [string, () => ConstructorParameters<typeof Headers>[0]][] = [
      ['array of pairs', () => credentialPairs],
      ['Headers instance', () => new Headers(credentialPairs)],
    ];

    const expectShape = (hops: { headers: Record<string, string> }[]) => {
      expect(hops[0].headers['x-api-key']).toBe(API_KEY);
      expect(hops[0].headers.authorization).toBe(EXTRA_HEADERS.Authorization);
      expect(hops[1].headers['x-api-key']).toBe(API_KEY);
      expect(hops[1].headers.cookie).toBe(EXTRA_HEADERS.Cookie);
      expect(hops[2].headers).not.toHaveProperty('x-api-key');
      expect(hops[2].headers).not.toHaveProperty('authorization');
      expect(hops[2].headers).not.toHaveProperty('cookie');
      expect(hops[2].headers['x-request-tag']).toBe('tag-1');
    };

    const routes = () => ({
      [`${BASE_URL}/v1/start`]: redirectTo(302, '/v1/same'),
      [`${BASE_URL}/v1/same`]: redirectTo(302, target),
      [target]: ok,
    });

    it.each(shapes)('client-level fetchOptions.headers as %s', async (_label, make) => {
      const { fetch, hops } = createFetch(routes());
      const payos = createClient(fetch, { headers: make() });

      await expect(payos.get('/v1/start')).resolves.toEqual(RESULT);
      expectShape(hops);
    });

    it.each(shapes)('per-request fetchOptions.headers as %s', async (_label, make) => {
      const { fetch, hops } = createFetch(routes());
      const payos = createClient(fetch);

      await expect(payos.get('/v1/start', { fetchOptions: { headers: make() } })).resolves.toEqual(RESULT);
      expectShape(hops);
    });
  });

  describe('caller redirect policy', () => {
    it('leaves redirects to fetch when the client sets an explicit redirect option', async () => {
      const target = 'https://other.payos.test/v1/next';
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/start`]: redirectTo(302, target),
        [target]: ok,
      });
      const payos = createClient(fetch, { redirect: 'manual' });

      const error = await payos.get('/v1/start').catch((err: unknown) => err);

      expect(error).toBeInstanceOf(APIError);
      expect((error as APIError).status).toBe(302);
      expect(hops).toHaveLength(1);
      expect(hops[0].redirect).toBe('manual');
    });

    it('leaves redirects to fetch when the request sets an explicit redirect option', async () => {
      const target = 'https://other.payos.test/v1/next';
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/start`]: redirectTo(302, target),
        [target]: ok,
      });
      const payos = createClient(fetch);

      await expect(payos.get('/v1/start', { fetchOptions: { redirect: 'error' } })).rejects.toBeInstanceOf(
        APIError,
      );
      expect(hops).toHaveLength(1);
      expect(hops[0].redirect).toBe('error');
    });

    it('treats an explicit "follow" redirect option like the default', async () => {
      const target = 'https://other.payos.test/v1/next';
      const { fetch, hops } = createFetch({
        [`${BASE_URL}/v1/start`]: redirectTo(302, target),
        [target]: ok,
      });
      const payos = createClient(fetch, { redirect: 'follow' });

      await expect(payos.get('/v1/start', { headers: EXTRA_HEADERS })).resolves.toEqual(RESULT);
      expect(hops).toHaveLength(2);
      expect(hops[0].redirect).toBe('manual');
      expectNoCredentialHeaders(hops[1]);
    });

    it('leaves redirects to fetch when running in a browser', async () => {
      jest.spyOn(dp, 'isRunningInBrowser').mockReturnValue(true);
      const { fetch, hops } = createFetch({ [`${BASE_URL}/v1/start`]: ok });
      const payos = createClient(fetch);

      await expect(payos.get('/v1/start')).resolves.toEqual(RESULT);
      expect(hops).toHaveLength(1);
      expect(hops[0].redirect).toBeUndefined();
    });
  });

  describe('with the built-in fetch and local servers on two ports', () => {
    type Seen = { server: 'a' | 'b'; path: string; headers: http.IncomingHttpHeaders };
    let seen: Seen[];
    let serverA: http.Server;
    let serverB: http.Server;
    let originA: string;
    let originB: string;

    const listen = (server: http.Server) =>
      new Promise<string>((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
        });
      });

    const respond = (res: http.ServerResponse, path: string) => {
      const [, kind, target] = path.split('/');
      if (kind === 'to-a' || kind === 'to-b') {
        const origin = kind === 'to-a' ? originA : originB;
        res.writeHead(302, { Location: `${origin}/${target ?? 'done'}` }).end();
        return;
      }
      res
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ code: '00', desc: 'success', data: RESULT }));
    };

    beforeEach(async () => {
      seen = [];
      const handler = (name: 'a' | 'b') => (req: http.IncomingMessage, res: http.ServerResponse) => {
        const path = req.url ?? '/';
        seen.push({ server: name, path, headers: req.headers });
        // `/to-b/to-a` redirects to B at `/to-a`, which redirects back to A at `/done`.
        respond(res, path);
      };
      serverA = http.createServer(handler('a'));
      serverB = http.createServer(handler('b'));
      originA = await listen(serverA);
      originB = await listen(serverB);
    });

    afterEach(async () => {
      await Promise.all(
        [serverA, serverB].map(
          (server) =>
            new Promise<void>((resolve) => {
              server.closeAllConnections();
              server.close(() => resolve());
            }),
        ),
      );
    });

    const createLocalClient = () =>
      new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        partnerCode: PARTNER_CODE,
        baseURL: originA,
        maxRetries: 0,
        fetch: globalThis.fetch,
      });

    const expectNoCredentials = (headers: http.IncomingHttpHeaders) => {
      for (const name of CREDENTIAL_HEADERS) {
        expect(headers).not.toHaveProperty(name);
      }
    };

    it('cross-origin redirect to another port removes credential headers', async () => {
      const payos = createLocalClient();

      await expect(payos.get('/to-b', { headers: EXTRA_HEADERS })).resolves.toEqual(RESULT);

      expect(seen.map((entry) => [entry.server, entry.path])).toEqual([
        ['a', '/to-b'],
        ['b', '/done'],
      ]);
      expect(seen[0].headers['x-api-key']).toBe(API_KEY);
      expect(seen[0].headers['x-client-id']).toBe(CLIENT_ID);
      expect(seen[0].headers['x-partner-code']).toBe(PARTNER_CODE);
      expect(seen[0].headers.cookie).toBe(EXTRA_HEADERS.Cookie);
      expectNoCredentials(seen[1].headers);
      expect(seen[1].headers['x-request-tag']).toBe('tag-1');
    });

    it('credential headers stay removed after redirecting back to the original port', async () => {
      const payos = createLocalClient();

      await expect(payos.get('/to-b/to-a', { headers: EXTRA_HEADERS })).resolves.toEqual(RESULT);

      expect(seen.map((entry) => [entry.server, entry.path])).toEqual([
        ['a', '/to-b/to-a'],
        ['b', '/to-a'],
        ['a', '/done'],
      ]);
      expect(seen[0].headers['x-api-key']).toBe(API_KEY);
      expectNoCredentials(seen[1].headers);
      expectNoCredentials(seen[2].headers);
    });
  });
});
