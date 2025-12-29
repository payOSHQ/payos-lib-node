import {
  PayOS,
  PayoutRequest,
  Payout,
  EstimateCredit,
  PayoutListResponse,
  GetPayoutListParam,
} from '../../../../src';

describe('Payouts', () => {
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

  describe('create()', () => {
    const validPayoutRequest: PayoutRequest = {
      referenceId: 'referenceId',
      amount: 2000,
      description: 'payout',
      toBin: '970422',
      toAccountNumber: '0123456789',
      category: ['salary', 'bonus'],
    };

    const mockPayoutResponse: Payout = {
      id: 'payout-id',
      referenceId: 'referenceId',
      transactions: [
        {
          id: 'txn-id',
          referenceId: 'referenceId',
          amount: 2000,
          description: 'payout',
          toBin: '970422',
          toAccountNumber: '0123456789',
          toAccountName: 'NGUYEN VAN A',
          reference: 'FT-REFERENCE',
          transactionDatetime: '2025-12-12T09:00:00+07:00',
          errorMessage: null,
          errorCode: null,
          state: 'SUCCEEDED',
        },
      ],
      category: ['salary', 'bonus'],
      approvalState: 'COMPLETED',
      createdAt: '2025-12-12T09:00:00+07:00',
    };

    it('should create payout successfully with generated idempotency key', async () => {
      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockPayoutResponse,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-signature': 'mock-signature' },
          },
        );
      });

      (payos as any).crypto = {
        createUuidv4: jest.fn().mockReturnValue('generated-uuid'),
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payouts.create(validPayoutRequest);

      expect(result).toEqual(mockPayoutResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payouts/`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-idempotency-key': 'generated-uuid',
          }),
        }),
      );
    });

    it('should create payout successfully with custom idempotency key', async () => {
      const customIdempotencyKey = 'custom-uuid-12345';

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockPayoutResponse,
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

      const result = await payos.payouts.create(validPayoutRequest, customIdempotencyKey);

      expect(result).toEqual(mockPayoutResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payouts/`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-idempotency-key': customIdempotencyKey,
          }),
        }),
      );
    });

    it('should create payout without category', async () => {
      const payoutWithoutCategory: PayoutRequest = {
        ...validPayoutRequest,
        category: undefined,
      };

      const responseWithoutCategory = {
        ...mockPayoutResponse,
        category: null,
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: responseWithoutCategory,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-signature': 'mock-signature' },
          },
        );
      });

      (payos as any).crypto = {
        createUuidv4: jest.fn().mockReturnValue('uuid'),
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payouts.create(payoutWithoutCategory);

      expect(result).toEqual(responseWithoutCategory);
      expect(result.category).toBeNull();
    });
  });

  describe('get()', () => {
    it('should get payout successfully with COMPLETED state', async () => {
      const payoutId = 'payout-123';
      const mockPayout: Payout = {
        id: payoutId,
        referenceId: 'referenceId',
        transactions: [
          {
            id: 'txn-id',
            referenceId: 'referenceId',
            amount: 2000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '0123456789',
            toAccountName: 'NGUYEN VAN A',
            reference: 'FT-REFERENCE',
            transactionDatetime: '2025-12-12T09:00:00+07:00',
            errorMessage: null,
            errorCode: null,
            state: 'SUCCEEDED',
          },
        ],
        category: ['salary'],
        approvalState: 'COMPLETED',
        createdAt: '2025-12-12T09:00:00+07:00',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockPayout,
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

      const result = await payos.payouts.get(payoutId);

      expect(result).toEqual(mockPayout);
      expect(result.approvalState).toBe('COMPLETED');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payouts/${payoutId}`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should get payout with FAILED state', async () => {
      const payoutId = 'payout-failed';
      const mockFailedPayout: Payout = {
        id: payoutId,
        referenceId: 'referenceId',
        transactions: [
          {
            id: 'txn-id',
            referenceId: 'referenceId',
            amount: 2000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '0123456789',
            toAccountName: 'NGUYEN VAN A',
            reference: null,
            transactionDatetime: null,
            errorMessage: 'error message',
            errorCode: 'error code',
            state: 'FAILED',
          },
        ],
        category: null,
        approvalState: 'FAILED',
        createdAt: '2025-12-12T09:00:00+07:00',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockFailedPayout,
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

      const result = await payos.payouts.get(payoutId);

      expect(result).toEqual(mockFailedPayout);
      expect(result.approvalState).toBe('FAILED');
      expect(result.transactions[0].state).toBe('FAILED');
      expect(result.transactions[0].errorMessage).toBe('error message');
    });

    it('should get payout with multiple transactions', async () => {
      const payoutId = 'payout-multi';
      const mockMultiTxnPayout: Payout = {
        id: payoutId,
        referenceId: 'referenceId',
        transactions: [
          {
            id: 'txn-1',
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '0123456789',
            toAccountName: 'NGUYEN VAN A',
            reference: 'FT-REF-1',
            transactionDatetime: '2025-12-12T09:00:00+07:00',
            errorMessage: null,
            errorCode: null,
            state: 'SUCCEEDED',
          },
          {
            id: 'txn-2',
            referenceId: 'ref-2',
            amount: 3000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '9876543210',
            toAccountName: 'TRAN THI B',
            reference: 'FT-REF-2',
            transactionDatetime: '2025-12-12T09:00:00+07:00',
            errorMessage: null,
            errorCode: null,
            state: 'SUCCEEDED',
          },
        ],
        category: ['salary'],
        approvalState: 'COMPLETED',
        createdAt: '2025-12-12T09:00:00+07:00',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockMultiTxnPayout,
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

      const result = await payos.payouts.get(payoutId);

      expect(result).toEqual(mockMultiTxnPayout);
      expect(result.transactions).toHaveLength(2);
      expect(result.approvalState).toBe('COMPLETED');
    });
  });

  describe('estimateCredit()', () => {
    it('should estimate credit for single payout', async () => {
      const payoutRequest: PayoutRequest = {
        referenceId: 'ref-123',
        amount: 5000,
        description: 'salary',
        toBin: '970422',
        toAccountNumber: '0123456789',
        category: ['salary'],
      };

      const mockEstimate: EstimateCredit = {
        estimateCredit: 5100,
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockEstimate,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payouts.estimateCredit(payoutRequest);

      expect(result).toEqual(mockEstimate);
      expect(result.estimateCredit).toBe(5100);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payouts/estimate-credit`,
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should estimate credit for batch payout', async () => {
      const batchPayoutRequest = {
        referenceId: 'batch-ref',
        category: ['salary'],
        validateDestination: true,
        payouts: [
          {
            referenceId: 'ref-1',
            amount: 2000,
            description: 'payout 1',
            toBin: '970422',
            toAccountNumber: '0123456789',
          },
          {
            referenceId: 'ref-2',
            amount: 3000,
            description: 'payout 2',
            toBin: '970422',
            toAccountNumber: '9876543210',
          },
        ],
      };

      const mockEstimate: EstimateCredit = {
        estimateCredit: 5200,
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockEstimate,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payouts.estimateCredit(batchPayoutRequest);

      expect(result).toEqual(mockEstimate);
      expect(result.estimateCredit).toBe(5200);
    });
  });

  describe('list()', () => {
    it('should list payouts with default pagination', async () => {
      const mockResponse: PayoutListResponse = {
        payouts: [
          {
            id: 'payout-1',
            referenceId: 'ref-1',
            transactions: [
              {
                id: 'txn-1',
                referenceId: 'ref-1',
                amount: 2000,
                description: 'payout',
                toBin: '970422',
                toAccountNumber: '0123456789',
                toAccountName: 'NGUYEN VAN A',
                reference: 'FT-REF',
                transactionDatetime: '2025-12-12T09:00:00+07:00',
                errorMessage: null,
                errorCode: null,
                state: 'SUCCEEDED',
              },
            ],
            category: ['salary'],
            approvalState: 'COMPLETED',
            createdAt: '2025-12-12T09:00:00+07:00',
          },
        ],
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
          count: 1,
          hasMore: false,
        },
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockResponse,
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

      const result = await payos.payouts.list();

      expect(result.data).toEqual(mockResponse.payouts);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/payouts'),
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should list payouts with custom pagination', async () => {
      const params: GetPayoutListParam = {
        limit: 20,
        offset: 10,
      };

      const mockResponse: PayoutListResponse = {
        payouts: [],
        pagination: {
          limit: 20,
          offset: 10,
          total: 100,
          count: 0,
          hasMore: true,
        },
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockResponse,
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

      const result = await payos.payouts.list(params);

      expect(result.data).toEqual(mockResponse.payouts);
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('limit=20');
      expect(callUrl).toContain('offset=10');
    });

    it('should list payouts with date filters converted to ISO strings', async () => {
      const fromDate = new Date('2025-01-01T00:00:00Z');
      const toDate = new Date('2025-12-31T23:59:59Z');

      const params: GetPayoutListParam = {
        fromDate,
        toDate,
        limit: 10,
        offset: 0,
      };

      const mockResponse: PayoutListResponse = {
        payouts: [],
        pagination: {
          limit: 10,
          offset: 0,
          total: 0,
          count: 0,
          hasMore: false,
        },
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockResponse,
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

      await payos.payouts.list(params);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('fromDate=' + encodeURIComponent(fromDate.toISOString()));
      expect(callUrl).toContain('toDate=' + encodeURIComponent(toDate.toISOString()));
    });

    it('should list payouts with category array joined as comma-separated string', async () => {
      const params: GetPayoutListParam = {
        category: ['salary', 'bonus', 'commission'],
        limit: 10,
        offset: 0,
      };

      const mockResponse: PayoutListResponse = {
        payouts: [],
        pagination: {
          limit: 10,
          offset: 0,
          total: 0,
          count: 0,
          hasMore: false,
        },
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockResponse,
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

      await payos.payouts.list(params);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('category=salary%2Cbonus%2Ccommission');
    });

    it('should list payouts with approval state filter', async () => {
      const params: GetPayoutListParam = {
        approvalState: 'COMPLETED',
        limit: 10,
        offset: 0,
      };

      const mockResponse: PayoutListResponse = {
        payouts: [
          {
            id: 'payout-1',
            referenceId: 'ref-1',
            transactions: [],
            category: null,
            approvalState: 'COMPLETED',
            createdAt: '2025-12-12T09:00:00+07:00',
          },
        ],
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
          count: 1,
          hasMore: false,
        },
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockResponse,
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

      const result = await payos.payouts.list(params);

      expect(result.data[0].approvalState).toBe('COMPLETED');
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('approvalState=COMPLETED');
    });
  });
});
