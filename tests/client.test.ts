import { PayOS } from '../src';
import { createImmediateSignal, mockAny, mockTimeout, createTogglingSignal } from './utils/abort-signal';
import * as dp from '../src/utils/detect-platform';

describe('PayOS Client', () => {
  const CLIENT_ID = 'test-client-id';
  const API_KEY = 'test-api-key';
  const CHECKSUM_KEY = 'test-checksum-key';
  const BASE_URL = 'https://api-test.payos.vn';

  describe('initialization', () => {
    it('should create a PayOS client with valid options', () => {
      const payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        baseURL: BASE_URL,
      });

      expect(payos.clientId).toBe(CLIENT_ID);
      expect(payos.apiKey).toBe(API_KEY);
      expect(payos.checksumKey).toBe(CHECKSUM_KEY);
      expect(payos.baseURL).toBe(BASE_URL);
    });

    it('should throw error when clientId is missing', () => {
      expect(() => {
        new PayOS({
          apiKey: API_KEY,
          checksumKey: CHECKSUM_KEY,
        });
      }).toThrow('The PAYOS_CLIENT_ID environment variable is missing or empty');
    });

    it('should throw error when apiKey is missing', () => {
      expect(() => {
        new PayOS({
          clientId: CLIENT_ID,
          checksumKey: CHECKSUM_KEY,
        });
      }).toThrow('The PAYOS_API_KEY environment variable is missing or empty');
    });

    it('should throw error when checksumKey is missing', () => {
      expect(() => {
        new PayOS({
          clientId: CLIENT_ID,
          apiKey: API_KEY,
        });
      }).toThrow('The PAYOS_CHECKSUM_KEY environment variable is missing or empty');
    });

    it('should use default timeout and max retries', () => {
      const payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
      });

      expect(payos.timeout).toBe(PayOS.DEFAULT_TIMEOUT);
      expect(payos.maxRetries).toBe(PayOS.MAX_RETRIES);
    });

    it('should override default timeout and max retries', () => {
      const payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        timeout: 30000,
        maxRetries: 1,
      });

      expect(payos.timeout).toBe(30000);
      expect(payos.maxRetries).toBe(1);
    });

    it('should use default base URL when not provided', () => {
      const payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
      });

      expect(payos.baseURL).toBe('https://api-merchant.payos.vn');
    });

    it('should set partner code when provided', () => {
      const partnerCode = 'partner-123';
      const payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        partnerCode,
      });

      expect(payos.partnerCode).toBe(partnerCode);
    });

    it('should initialize resources', () => {
      const payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
      });

      expect(payos.paymentRequests).toBeDefined();
      expect(payos.payouts).toBeDefined();
      expect(payos.payoutsAccount).toBeDefined();
      expect(payos.webhooks).toBeDefined();
    });

    it('should use global fetch by default when present', () => {
      const originalFetch = (global as any).fetch;
      try {
        (global as any).fetch = jest.fn();
        const payos = new PayOS({ clientId: CLIENT_ID, apiKey: API_KEY, checksumKey: CHECKSUM_KEY });
        expect(payos['fetch']).toBe((global as any).fetch);
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    it('should throw when no global fetch and no fetch option provided', () => {
      const originalFetch = (global as any).fetch;
      try {
        delete (global as any).fetch;
        expect(
          () => new PayOS({ clientId: CLIENT_ID, apiKey: API_KEY, checksumKey: CHECKSUM_KEY }),
        ).toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    it('should throw when globalThis is undefined', () => {
      const spy = jest.spyOn(dp, 'getDefaultFetch').mockImplementation(() => {
        throw new Error('`fetch` is not defined as a global');
      });
      try {
        expect(
          () => new PayOS({ clientId: CLIENT_ID, apiKey: API_KEY, checksumKey: CHECKSUM_KEY }),
        ).toThrow();
      } finally {
        spy.mockRestore();
      }
    });

    it('should use provided fetch option when passed', () => {
      const myFetch = jest.fn();
      const payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        fetch: myFetch,
      });
      expect(payos['fetch']).toBe(myFetch);
    });
  });

  describe('buildHeaders', () => {
    let payos: PayOS;

    beforeEach(() => {
      payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
      });
    });

    it('should build headers with required fields', () => {
      const headers = payos['buildHeaders']();

      expect(headers['x-client-id']).toBe(CLIENT_ID);
      expect(headers['x-api-key']).toBe(API_KEY);
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toContain('PayOS/JS');
    });

    it('should include partner code in headers when set', () => {
      const partnerCode = 'partner-123';
      const payosWithPartner = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        partnerCode,
      });

      const headers = payosWithPartner['buildHeaders']();

      expect(headers['x-partner-code']).toBe(partnerCode);
    });

    it('should merge additional headers', () => {
      const additionalHeaders = { 'x-custom': 'custom-value' };
      const headers = payos['buildHeaders'](additionalHeaders);

      expect(headers['x-custom']).toBe('custom-value');
      expect(headers['x-client-id']).toBe(CLIENT_ID);
    });

    it('should not include partner code when not set', () => {
      const headers = payos['buildHeaders']();

      expect(headers['x-partner-code']).toBeUndefined();
    });
  });

  describe('buildUrl', () => {
    let payos: PayOS;

    beforeEach(() => {
      payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        baseURL: BASE_URL,
      });
    });

    it('should build URL from endpoint', () => {
      const url = payos['buildUrl']('/v2/payment-requests');

      expect(url).toBe(`${BASE_URL}/v2/payment-requests`);
    });

    it('should build URL with query parameters', () => {
      const queries = { limit: 10, offset: 0 };
      const url = payos['buildUrl']('/v1/payouts', queries);

      expect(url).toContain(`${BASE_URL}/v1/payouts`);
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=0');
    });

    it('should handle string query parameter values', () => {
      const queries = { filter: 'SUCCEEDED', status: 'PROCESSING' };
      const url = payos['buildUrl']('/v1/payouts', queries);

      expect(url).toContain('filter=SUCCEEDED');
      expect(url).toContain('status=PROCESSING');
    });

    it('should handle array query parameters as JSON', () => {
      const queries = { ids: ['id1', 'id2', 'id3'] };
      const url = payos['buildUrl']('/v1/payouts', queries);

      expect(url).toContain('ids=');
      expect(url).toContain('id1');
    });

    it('should handle object query parameters as JSON', () => {
      const queries = { filter: { status: 'SUCCEEDED' } };
      const url = payos['buildUrl']('/v1/payouts', queries);

      expect(url).toContain('filter=');
      expect(url).toContain('status');
    });

    it('should skip undefined query parameters', () => {
      const queries = { limit: 10, offset: undefined, status: 'SUCCEEDED' };
      const url = payos['buildUrl']('/v1/payouts', queries);

      expect(url).not.toContain('offset');
      expect(url).toContain('limit=10');
      expect(url).toContain('status=SUCCEEDED');
    });

    it('should handle null query parameters', () => {
      const queries = { limit: 10, filter: null };
      const url = payos['buildUrl']('/v1/payouts', queries);

      expect(url).toContain('filter=');
    });

    it('should handle empty query object', () => {
      const url = payos['buildUrl']('/v2/payment-requests', {});

      expect(url).toBe(`${BASE_URL}/v2/payment-requests`);
    });
  });

  describe('buildBody', () => {
    let payos: PayOS;

    beforeEach(() => {
      payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
      });
    });

    it('should serialize object to JSON string', () => {
      const body = { orderCode: 123, amount: 50000 };
      const result = payos['buildBody'](body);

      expect(typeof result).toBe('string');
      expect(JSON.parse(result)).toEqual(body);
    });

    it('should return string body as is', () => {
      const body = 'test string';
      const result = payos['buildBody'](body);

      expect(result).toBe(body);
    });

    it('should return null body as is', () => {
      const result = payos['buildBody'](null);

      expect(result).toBeNull();
    });

    it('should return undefined body as is', () => {
      const result = payos['buildBody'](undefined);

      expect(result).toBeUndefined();
    });

    it('should not serialize ReadableStream', () => {
      const stream = new ReadableStream();
      const result = payos['buildBody'](stream);

      expect(result).toBe(stream);
    });

    it('should not serialize FormData', () => {
      const formData = new FormData();
      const result = payos['buildBody'](formData);

      expect(result).toBe(formData);
    });

    it('should not serialize ArrayBuffer', () => {
      const buffer = new ArrayBuffer(8);
      const result = payos['buildBody'](buffer);

      expect(result).toBe(buffer);
    });

    it('should not serialize Uint8Array', () => {
      const array = new Uint8Array([1, 2, 3]);
      const result = payos['buildBody'](array);

      expect(result).toBe(array);
    });
  });

  describe('HTTP methods', () => {
    let payos: PayOS;
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn();
      payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        fetch: mockFetch,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call get method', async () => {
      const spy = jest.spyOn(payos as any, 'request').mockResolvedValue('ok');
      await payos.get('/v1/test');
      expect(spy).toHaveBeenCalledWith({ method: 'GET', path: '/v1/test' });
    });

    it('should call post method', async () => {
      const spy = jest.spyOn(payos as any, 'request').mockResolvedValue('ok');
      await payos.post('/v1/test', { body: { a: 1 } });
      expect(spy).toHaveBeenCalledWith({ method: 'POST', path: '/v1/test', body: { a: 1 } });
    });

    it('should call patch method', async () => {
      const spy = jest.spyOn(payos as any, 'request').mockResolvedValue('ok');
      await payos.patch('/v1/test', { body: { a: 1 } });
      expect(spy).toHaveBeenCalledWith({ method: 'PATCH', path: '/v1/test', body: { a: 1 } });
    });

    it('should call put method', async () => {
      const spy = jest.spyOn(payos as any, 'request').mockResolvedValue('ok');
      await payos.put('/v1/test', { body: { a: 1 } });
      expect(spy).toHaveBeenCalledWith({ method: 'PUT', path: '/v1/test', body: { a: 1 } });
    });

    it('should call delete method', async () => {
      const spy = jest.spyOn(payos as any, 'request').mockResolvedValue('ok');
      await payos.delete('/v1/test');
      expect(spy).toHaveBeenCalledWith({ method: 'DELETE', path: '/v1/test' });
    });

    it('should call request method with GET', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: 'ok',
          }),
          { status: 200 },
        ),
      );
      await payos.request({ path: '/v1/test' } as any);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/test'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should call downloadFile method', async () => {
      const spy = jest.spyOn(payos as any, 'executeFileDownload').mockResolvedValue({
        filename: 'f',
        contentType: 'application/octet-stream',
        size: 1,
        data: new ArrayBuffer(1),
      });
      await payos.downloadFile({ path: '/v1/file' } as any);
      expect(spy).toHaveBeenCalledWith({ path: '/v1/file' }, undefined);
    });
  });

  describe('retry and timeout', () => {
    let payos: PayOS;
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn();
      payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        fetch: mockFetch,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw ConnectionTimeoutError immediately when timeout is 0', async () => {
      const restoreAny = mockAny((signals: AbortSignal[]) => {
        if (signals.some((s) => !!s?.aborted)) {
          return createImmediateSignal();
        }
        const ac = new AbortController();
        for (const s of signals) {
          s.addEventListener('abort', () => ac.abort(), { once: true });
        }
        return ac.signal;
      });

      const restoreTimeout = mockTimeout((ms: number) => {
        const ac = new AbortController();
        if (ms === 0) {
          ac.abort();
        } else {
          setTimeout(() => ac.abort(), ms);
        }
        return ac.signal;
      });

      try {
        let err: any;
        try {
          await payos.get('/v1/test', { timeout: 0 });
        } catch (e) {
          err = e;
        }
        expect(err).toBeInstanceOf(PayOS.ConnectionTimeoutError);
        expect(mockFetch).not.toHaveBeenCalled();
      } finally {
        restoreAny();
        restoreTimeout();
      }
    });

    it('should retry on network failure and succeed on subsequent attempt', async () => {
      const successResponse = new Response(
        JSON.stringify({ code: '00', desc: 'success', data: { result: 'ok' } }),
        { status: 200 },
      );
      mockFetch.mockRejectedValueOnce(new Error('network failure')).mockResolvedValueOnce(successResponse);
      (payos as any).sleep = jest.fn().mockResolvedValue(undefined);
      const res = await payos.get('/v1/test');
      expect(res).toEqual({ result: 'ok' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry when timeout is non-zero', async () => {
      const successResponse = new Response(
        JSON.stringify({ code: '00', desc: 'success', data: { result: 'ok' } }),
        { status: 200 },
      );
      mockFetch.mockRejectedValueOnce(new Error('network failure')).mockResolvedValueOnce(successResponse);
      (payos as any).sleep = jest.fn().mockResolvedValue(undefined);
      const res = await payos.get('/v1/test', { timeout: 50 });
      expect(res).toEqual({ result: 'ok' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw ConnectionError when no retries left for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network failure'));
      await expect(payos.get('/v1/test', { maxRetries: 0 })).rejects.toBeInstanceOf(PayOS.ConnectionError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw ConnectionTimeoutError when timeout aborts during failed request with no retries', async () => {
      const restore = mockTimeout(() => createTogglingSignal() as any);

      try {
        mockFetch.mockRejectedValueOnce(new Error('network failure after timeout'));
        await expect(payos.get('/v1/test', { maxRetries: 0, timeout: 1 })).rejects.toBeInstanceOf(
          PayOS.ConnectionTimeoutError,
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
      } finally {
        restore();
      }
    });

    it('should honor Retry-After header on 429 responses', async () => {
      const retryHeaders = new Headers({ 'retry-after': '1' });
      const rateLimitResponse = new Response('Too Many Requests', { status: 429, headers: retryHeaders });
      const successResponse = new Response(JSON.stringify({ code: '00', desc: 'success', data: 'ok' }), {
        status: 200,
      });
      mockFetch.mockResolvedValueOnce(rateLimitResponse).mockResolvedValueOnce(successResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;
      const result = await payos.get('/v1/test');
      expect(result).toBe('ok');
      expect(sleepSpy).toHaveBeenCalledWith(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should honor Retry-After header with HTTP-date string', async () => {
      const fixedNow = 1700000000000; // fixed timestamp in ms
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => fixedNow);
      const futureDate = new Date(fixedNow + 2000).toUTCString();

      const headers = new Headers({ 'retry-after': futureDate });
      const rateLimitResponse = new Response('Too Many Requests', { status: 429, headers });
      const successResponse = new Response(JSON.stringify({ code: '00', desc: 'success', data: 'ok' }), {
        status: 200,
      });

      mockFetch.mockResolvedValueOnce(rateLimitResponse).mockResolvedValueOnce(successResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;

      const result = await payos.get('/v1/test');
      expect(result).toBe('ok');

      const expectedMs = Date.parse(futureDate) - fixedNow;
      expect(sleepSpy).toHaveBeenCalledWith(expectedMs);
      nowSpy.mockRestore();
    });

    it('should honor x-ratelimit-reset header on 429 responses', async () => {
      const fixedNow = 1700000000000; // fixed timestamp in ms
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => fixedNow);
      const futureSec = Math.floor(fixedNow / 1000) + 2; // 2 seconds in the future
      const headers = new Headers({ 'x-ratelimit-reset': String(futureSec) });
      const rateLimitResponse = new Response('Too Many Requests', { status: 429, headers });
      const successResponse = new Response(JSON.stringify({ code: '00', desc: 'success', data: 'ok' }), {
        status: 200,
      });
      mockFetch.mockResolvedValueOnce(rateLimitResponse).mockResolvedValueOnce(successResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;

      const result = await payos.get('/v1/test');
      expect(result).toBe('ok');

      const expectedMs = futureSec * 1000 - fixedNow;
      expect(sleepSpy).toHaveBeenCalledWith(expectedMs);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      nowSpy.mockRestore();
    });

    it('should retry on HTTP 408 responses', async () => {
      const timeoutResponse = new Response('Request Timeout', { status: 408 });
      const successResponse = new Response(JSON.stringify({ code: '00', desc: 'success', data: 'ok' }), {
        status: 200,
      });
      mockFetch.mockResolvedValueOnce(timeoutResponse).mockResolvedValueOnce(successResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;
      const result = await payos.get('/v1/test');
      expect(result).toBe('ok');
      expect(sleepSpy).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on HTTP 5xx responses', async () => {
      const serverError = new Response('Server Error', { status: 500 });
      const successResponse = new Response(JSON.stringify({ code: '00', desc: 'success', data: 'ok' }), {
        status: 200,
      });
      mockFetch.mockResolvedValueOnce(serverError).mockResolvedValueOnce(successResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;
      const result = await payos.get('/v1/test');
      expect(result).toBe('ok');
      expect(sleepSpy).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // downloadFile-specific retry/timeout tests
    it('downloadFile should throw ConnectionTimeoutError immediately when timeout is 0', async () => {
      const restoreAny = mockAny((signals: AbortSignal[]) => {
        if (signals.some((s) => !!s?.aborted)) {
          return createImmediateSignal();
        }
        const ac = new AbortController();
        for (const s of signals) {
          s.addEventListener('abort', () => ac.abort(), { once: true });
        }
        return ac.signal;
      });

      const restoreTimeout = mockTimeout((ms: number) => {
        const ac = new AbortController();
        if (ms === 0) {
          ac.abort();
        } else {
          setTimeout(() => ac.abort(), ms);
        }
        return ac.signal;
      });

      try {
        await expect(
          payos.downloadFile({ path: '/v1/file', timeout: 0, method: 'GET' }),
        ).rejects.toBeInstanceOf(PayOS.ConnectionTimeoutError);
        expect(mockFetch).not.toHaveBeenCalled();
      } finally {
        restoreAny();
        restoreTimeout();
      }
    });

    it('downloadFile should retry on network failure and succeed on subsequent attempt', async () => {
      const successFileResponse = new Response(new ArrayBuffer(1), {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': '1',
          'content-disposition': 'attachment; filename="f"',
        },
      });

      mockFetch
        .mockRejectedValueOnce(new Error('network failure'))
        .mockResolvedValueOnce(successFileResponse);
      (payos as any).sleep = jest.fn().mockResolvedValue(undefined);

      const res = await payos.downloadFile({ path: '/v1/file', method: 'GET' });
      expect(res.filename).toBe('f');
      expect(res.contentType).toBe('application/octet-stream');
      expect(res.size).toBe(1);
      expect(res.data).toBeInstanceOf(ArrayBuffer);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('downloadFile should honor Retry-After header on 429 responses', async () => {
      const retryHeaders = new Headers({ 'retry-after': '1' });
      const rateLimitResponse = new Response('Too Many Requests', { status: 429, headers: retryHeaders });
      const successFileResponse = new Response(new ArrayBuffer(1), {
        status: 200,
        headers: { 'content-type': 'application/octet-stream', 'content-length': '1' },
      });

      mockFetch.mockResolvedValueOnce(rateLimitResponse).mockResolvedValueOnce(successFileResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;

      const res = await payos.downloadFile({ path: '/v1/file', method: 'GET' });
      expect(res.data).toBeInstanceOf(ArrayBuffer);
      expect(sleepSpy).toHaveBeenCalledWith(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('downloadFile should honor x-ratelimit-reset header on 429 responses', async () => {
      const headers = new Headers({ 'x-ratelimit-reset': '2' });
      const rateLimitResponse = new Response('Too Many Requests', { status: 429, headers });
      const successFileResponse = new Response(new ArrayBuffer(1), {
        status: 200,
        headers: { 'content-type': 'application/octet-stream', 'content-length': '1' },
      });

      mockFetch.mockResolvedValueOnce(rateLimitResponse).mockResolvedValueOnce(successFileResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;

      const res = await payos.downloadFile({ path: '/v1/file', method: 'GET' });
      expect(res.data).toBeInstanceOf(ArrayBuffer);
      expect(sleepSpy).toHaveBeenCalledWith(2000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('downloadFile should retry on HTTP 408 responses', async () => {
      const timeoutResponse = new Response('Request Timeout', { status: 408 });
      const successFileResponse = new Response(new ArrayBuffer(1), {
        status: 200,
        headers: { 'content-type': 'application/octet-stream', 'content-length': '1' },
      });

      mockFetch.mockResolvedValueOnce(timeoutResponse).mockResolvedValueOnce(successFileResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;

      const res = await payos.downloadFile({ path: '/v1/file', method: 'GET' });
      expect(res.data).toBeInstanceOf(ArrayBuffer);
      expect(sleepSpy).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('downloadFile should retry on HTTP 5xx responses', async () => {
      const serverError = new Response('Server Error', { status: 500 });
      const successFileResponse = new Response(new ArrayBuffer(1), {
        status: 200,
        headers: { 'content-type': 'application/octet-stream', 'content-length': '1' },
      });

      mockFetch.mockResolvedValueOnce(serverError).mockResolvedValueOnce(successFileResponse);
      const sleepSpy = jest.fn().mockResolvedValue(undefined);
      (payos as any).sleep = sleepSpy;

      const res = await payos.downloadFile({ path: '/v1/file', method: 'GET' });
      expect(res.data).toBeInstanceOf(ArrayBuffer);
      expect(sleepSpy).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('downloadFile should surface ConnectionError when no retries left for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('permanent network failure'));
      await expect(
        payos.downloadFile({ path: '/v1/file', maxRetries: 0, method: 'GET' }),
      ).rejects.toBeInstanceOf(PayOS.ConnectionError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('downloadFile should throw UserAbortError when aborting during request (after fetch started)', async () => {
      const ac = new AbortController();
      mockFetch.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return Promise.reject(new Error('network failure'));
      });

      const promise = payos.downloadFile({ path: '/v1/file', signal: ac.signal, method: 'GET' });
      ac.abort();

      await expect(promise).rejects.toBeInstanceOf(PayOS.UserAbortError);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('downloadFile should throw UserAbortError when passed an already-aborted signal', async () => {
      const ac2 = new AbortController();
      ac2.abort();
      await expect(
        payos.downloadFile({ path: 'v1/file', signal: ac2.signal, method: 'GET' }),
      ).rejects.toBeInstanceOf(PayOS.UserAbortError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw UserAbortError when aborting during request (after fetch started)', async () => {
      const ac = new AbortController();

      // Simulate a fetch that fails after a short delay so we can abort in-flight
      mockFetch.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return Promise.reject(new Error('network failure'));
      });

      const promise = payos.get('/v1/test', { signal: ac.signal });
      // Abort the signal after starting the request but before the fetch rejects
      ac.abort();

      await expect(promise).rejects.toBeInstanceOf(PayOS.UserAbortError);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw UserAbortError when passed an already-aborted signal', async () => {
      const ac2 = new AbortController();
      ac2.abort();
      await expect(payos.get('/v1/test', { signal: ac2.signal })).rejects.toBeInstanceOf(
        PayOS.UserAbortError,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('downloadFile failed', () => {
    let payos: PayOS;
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn();
      payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        fetch: mockFetch,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw error if response type is json', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 'non-success-code',
            desc: 'non success desc',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      await expect(payos.downloadFile({ path: '/v1/file', method: 'GET' })).rejects.toThrow(PayOS.APIError);
    });

    it('should throw UnauthorizedError', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: '401',
            desc: 'API Key or Client Key not found. Please obtain your key at https://my.payos.vn.',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      await expect(payos.downloadFile({ path: '/v1/file', method: 'GET' })).rejects.toThrow(
        PayOS.UnauthorizedError,
      );
    });
  });

  describe('signing and signature verification', () => {
    let payos: PayOS;
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn();
      payos = new PayOS({
        clientId: CLIENT_ID,
        apiKey: API_KEY,
        checksumKey: CHECKSUM_KEY,
        fetch: mockFetch,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('throws InvalidSignatureError when signature request type is invalid', async () => {
      await expect(
        payos.post('/v1/test', { body: { a: 1 }, signatureOpts: { request: 'invalid' as any } } as any),
      ).rejects.toBeInstanceOf(PayOS.InvalidSignatureError);
    });

    it('throws InvalidSignatureError when createSignatureOfPaymentRequest returns null', async () => {
      (payos as any).crypto = { createSignatureOfPaymentRequest: jest.fn().mockResolvedValue(null) } as any;

      await expect(
        payos.post('/v2/payment-requests', {
          body: { amount: 100 },
          signatureOpts: { request: 'create-payment-link' },
        } as any),
      ).rejects.toBeInstanceOf(PayOS.InvalidSignatureError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws InvalidSignatureError when createSignatureFromObj returns null', async () => {
      (payos as any).crypto = { createSignatureFromObj: jest.fn().mockResolvedValue(null) } as any;

      await expect(
        payos.post('/v1/test', { body: { a: 1 }, signatureOpts: { request: 'body' } } as any),
      ).rejects.toBeInstanceOf(PayOS.InvalidSignatureError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws InvalidSignatureError when createSignature returns null', async () => {
      (payos as any).crypto = { createSignature: jest.fn().mockResolvedValue(null) } as any;

      await expect(
        payos.post('/v1/test', { body: { a: 1 }, signatureOpts: { request: 'header' } } as any),
      ).rejects.toBeInstanceOf(PayOS.InvalidSignatureError);
    });

    it('attaches header signature on successful header signing', async () => {
      const headersCapture: any = {};
      mockFetch.mockImplementationOnce(async (_url: string, init: RequestInit) => {
        Object.assign(headersCapture, init.headers);
        return new Response(JSON.stringify({ code: '00', desc: 'success', data: { ok: true } }), {
          status: 200,
        });
      });

      (payos as any).crypto = { createSignature: jest.fn().mockResolvedValue('sign') } as any;

      const res = await payos.post('/v1/test', {
        body: { a: 1 },
        signatureOpts: { request: 'header' },
      } as any);
      expect(res).toEqual({ ok: true });
      expect((headersCapture as any)['x-signature']).toBe('sign');
    });

    it('attaches body signature when signing body', async () => {
      const bodyCapture: any = {};
      mockFetch.mockImplementationOnce(async (_url: string, init: RequestInit) => {
        bodyCapture.body = init.body;
        return new Response(JSON.stringify({ code: '00', desc: 'success', data: { ok: true } }), {
          status: 200,
        });
      });

      (payos as any).crypto = { createSignatureFromObj: jest.fn().mockResolvedValue('sign') } as any;

      const res = await payos.post('/v1/test', { body: { a: 1 }, signatureOpts: { request: 'body' } } as any);
      expect(res).toEqual({ ok: true });
      expect(JSON.parse(bodyCapture.body).signature).toBe('sign');
    });

    it('attaches payment-link signature when signing create-payment-link', async () => {
      const bodyCapture: any = {};
      mockFetch.mockImplementationOnce(async (_url: string, init: RequestInit) => {
        bodyCapture.body = init.body;
        return new Response(JSON.stringify({ code: '00', desc: 'success', data: { ok: true } }), {
          status: 200,
        });
      });

      (payos as any).crypto = {
        createSignatureOfPaymentRequest: jest.fn().mockResolvedValue('sign'),
      } as any;

      const res = await payos.post('/v2/payment-requests', {
        body: { amount: 100 },
        signatureOpts: { request: 'create-payment-link' },
      } as any);
      expect(res).toEqual({ ok: true });
      expect(JSON.parse(bodyCapture.body).signature).toBe('sign');
    });

    it('throws APIError when code is "00" but data is null', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '00', desc: 'ok', data: null }), { status: 200 }),
      );
      await expect(payos.get('/v1/test')).rejects.toBeInstanceOf(PayOS.APIError);
    });

    it('sleep resolves after ms using timer', async () => {
      jest.useFakeTimers();
      const sleepPromise = (payos as any).sleep(10);
      jest.advanceTimersByTime(10);
      await expect(sleepPromise).resolves.toBeUndefined();
      jest.useRealTimers();
    });

    it('throws BadRequestError when non-OK text response is returned', async () => {
      mockFetch.mockResolvedValueOnce(new Response('bad request', { status: 400 }));
      await expect(payos.get('/v1/test')).rejects.toBeInstanceOf(PayOS.BadRequestError);
    });

    it('throws APIError when JSON with code != "00" is returned', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '01', desc: 'err' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      await expect(payos.get('/v1/test')).rejects.toBeInstanceOf(PayOS.APIError);
    });

    it('throws InvalidSignatureError when response body signature mismatches', async () => {
      const data = { result: 'ok' };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '00', desc: 'success', data, signature: 'good' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      (payos as any).crypto = { createSignatureFromObj: jest.fn().mockResolvedValue('bad') } as any;

      await expect(payos.get('/v1/test', { signatureOpts: { response: 'body' } })).rejects.toBeInstanceOf(
        PayOS.InvalidSignatureError,
      );
    });

    it('throws InvalidSignatureError when response header signature mismatches', async () => {
      const data = { result: 'ok' };
      const headers = new Headers({ 'x-signature': 'good', 'Content-Type': 'application/json' });
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '00', desc: 'success', data }), { status: 200, headers }),
      );
      (payos as any).crypto = { createSignature: jest.fn().mockResolvedValue('bad') } as any;

      await expect(payos.get('/v1/test', { signatureOpts: { response: 'header' } })).rejects.toBeInstanceOf(
        PayOS.InvalidSignatureError,
      );
    });

    it('accepts valid response body signature', async () => {
      const data = { result: 'ok' };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '00', desc: 'success', data, signature: 'good' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      (payos as any).crypto = { createSignatureFromObj: jest.fn().mockResolvedValue('good') } as any;

      const res = await payos.get('/v1/test', { signatureOpts: { response: 'body' } });
      expect(res).toEqual(data);
    });

    it('accepts valid response header signature', async () => {
      const data = { result: 'ok' };
      const headers = new Headers({ 'x-signature': 'good', 'Content-Type': 'application/json' });
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '00', desc: 'success', data }), { status: 200, headers }),
      );
      (payos as any).crypto = { createSignature: jest.fn().mockResolvedValue('good') } as any;

      const res = await payos.get('/v1/test', { signatureOpts: { response: 'header' } });
      expect(res).toEqual(data);
    });
  });

  describe('error classes', () => {
    it('should expose PayOSError', () => {
      expect(PayOS.PayOSError).toBeDefined();
    });

    it('should expose APIError', () => {
      expect(PayOS.APIError).toBeDefined();
    });

    it('should expose UserAbortError', () => {
      expect(PayOS.UserAbortError).toBeDefined();
    });

    it('should expose ConnectionError', () => {
      expect(PayOS.ConnectionError).toBeDefined();
    });

    it('should expose ConnectionTimeoutError', () => {
      expect(PayOS.ConnectionTimeoutError).toBeDefined();
    });

    it('should expose BadRequestError', () => {
      expect(PayOS.BadRequestError).toBeDefined();
    });

    it('should expose UnauthorizedError', () => {
      expect(PayOS.UnauthorizedError).toBeDefined();
    });

    it('should expose ForbiddenError', () => {
      expect(PayOS.ForbiddenError).toBeDefined();
    });

    it('should expose NotFoundError', () => {
      expect(PayOS.NotFoundError).toBeDefined();
    });

    it('should expose TooManyRequest', () => {
      expect(PayOS.TooManyRequest).toBeDefined();
    });

    it('should expose InternalServerError', () => {
      expect(PayOS.InternalServerError).toBeDefined();
    });

    it('should expose InvalidSignatureError', () => {
      expect(PayOS.InvalidSignatureError).toBeDefined();
    });

    it('should expose WebhookError', () => {
      expect(PayOS.WebhookError).toBeDefined();
    });
  });

  describe('static constants', () => {
    it('should have DEFAULT_TIMEOUT constant', () => {
      expect(PayOS.DEFAULT_TIMEOUT).toBe(60000);
    });

    it('should have MAX_RETRIES constant', () => {
      expect(PayOS.MAX_RETRIES).toBe(2);
    });

    it('should have PayOS static reference', () => {
      expect(PayOS.PayOS).toBe(PayOS);
    });
  });
});
