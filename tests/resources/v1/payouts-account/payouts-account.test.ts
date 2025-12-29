import { PayOS, PayoutAccountInfo } from '../../../../src';

describe('PayoutsAccount', () => {
  const CLIENT_ID = 'test-client-id';
  const API_KEY = 'test-api-key';
  const CHECKSUM_KEY = 'test-checksum-key';
  const BASE_URL = 'https://api-test.payos.vn';

  let payos: PayOS;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();

    payos = new PayOS({
      clientId: CLIENT_ID,
      apiKey: API_KEY,
      checksumKey: CHECKSUM_KEY,
      baseURL: BASE_URL,
      fetch: mockFetch,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('balance()', () => {
    it('should get payout account balance successfully', async () => {
      const mockBalance: PayoutAccountInfo = {
        accountNumber: '0123456789',
        accountName: 'NGUYEN VAN A',
        balance: '5000000',
        currency: 'VND',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockBalance,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-signature': 'mock-signature' },
          },
        );
      });

      (payos as any).crypto = {
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payoutsAccount.balance();

      expect(result).toEqual(mockBalance);
      expect(result.balance).toBe('5000000');
      expect(result.currency).toBe('VND');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payouts-account/balance`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should get balance with different account data', async () => {
      const mockBalance: PayoutAccountInfo = {
        accountNumber: '9876543210',
        accountName: 'COMPANY ABC',
        balance: '10000000',
        currency: 'VND',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockBalance,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-signature': 'mock-signature' },
          },
        );
      });

      (payos as any).crypto = {
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payoutsAccount.balance();

      expect(result).toEqual(mockBalance);
      expect(result.accountName).toBe('COMPANY ABC');
      expect(result.balance).toBe('10000000');
    });

    it('should get balance with zero balance', async () => {
      const mockBalance: PayoutAccountInfo = {
        accountNumber: '0123456789',
        accountName: 'NGUYEN VAN A',
        balance: '0',
        currency: 'VND',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockBalance,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-signature': 'mock-signature' },
          },
        );
      });

      (payos as any).crypto = {
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payoutsAccount.balance();

      expect(result).toEqual(mockBalance);
      expect(result.balance).toBe('0');
    });
  });
});
