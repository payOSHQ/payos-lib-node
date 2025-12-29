import { PayOS, PayoutBatchRequest, Payout } from '../../../../../src';

describe('Batch', () => {
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
    it('should create batch payout with single item successfully', async () => {
      const batchRequest: PayoutBatchRequest = {
        referenceId: 'batch-ref-1',
        category: ['salary'],
        validateDestination: true,
        payouts: [
          {
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '0123456789',
          },
        ],
      };

      const mockResponse: Payout = {
        id: 'batch-id',
        referenceId: 'batch-ref-1',
        transactions: [
          {
            id: 'txn-id',
            referenceId: 'ref-1',
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
            data: mockResponse,
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

      const result = await payos.payouts.batch.create(batchRequest);

      expect(result).toEqual(mockResponse);
      expect(result.transactions).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payouts/batch`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-idempotency-key': 'generated-uuid',
          }),
        }),
      );
    });

    it('should create batch payout with multiple items successfully', async () => {
      const batchRequest: PayoutBatchRequest = {
        referenceId: 'batch-ref-multi',
        category: ['salary', 'bonus'],
        validateDestination: true,
        payouts: [
          {
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout 1',
            toBin: '970422',
            toAccountNumber: '0123456789',
          },
          {
            referenceId: 'ref-2',
            amount: 3000,
            description: 'batch payout 2',
            toBin: '970422',
            toAccountNumber: '9876543210',
          },
          {
            referenceId: 'ref-3',
            amount: 1500,
            description: 'batch payout 3',
            toBin: '970422',
            toAccountNumber: '1122334455',
          },
        ],
      };

      const mockResponse: Payout = {
        id: 'batch-id-multi',
        referenceId: 'batch-ref-multi',
        transactions: [
          {
            id: 'txn-1',
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout 1',
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
            description: 'batch payout 2',
            toBin: '970422',
            toAccountNumber: '9876543210',
            toAccountName: 'TRAN THI B',
            reference: 'FT-REF-2',
            transactionDatetime: '2025-12-12T09:00:00+07:00',
            errorMessage: null,
            errorCode: null,
            state: 'SUCCEEDED',
          },
          {
            id: 'txn-3',
            referenceId: 'ref-3',
            amount: 1500,
            description: 'batch payout 3',
            toBin: '970422',
            toAccountNumber: '1122334455',
            toAccountName: 'LE VAN C',
            reference: 'FT-REF-3',
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
        createUuidv4: jest.fn().mockReturnValue('uuid-multi'),
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payouts.batch.create(batchRequest);

      expect(result).toEqual(mockResponse);
      expect(result.transactions).toHaveLength(3);
      expect(result.category).toEqual(['salary', 'bonus']);
    });

    it('should create batch payout with no category', async () => {
      const batchRequest: PayoutBatchRequest = {
        referenceId: 'batch-ref-no-cat',
        category: null,
        validateDestination: false,
        payouts: [
          {
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '0123456789',
          },
        ],
      };

      const mockResponse: Payout = {
        id: 'batch-id',
        referenceId: 'batch-ref-no-cat',
        transactions: [
          {
            id: 'txn-id',
            referenceId: 'ref-1',
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
        category: null,
        approvalState: 'COMPLETED',
        createdAt: '2025-12-12T09:00:00+07:00',
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
        createUuidv4: jest.fn().mockReturnValue('uuid'),
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payouts.batch.create(batchRequest);

      expect(result).toEqual(mockResponse);
      expect(result.category).toBeNull();
    });

    it('should create batch payout with custom idempotency key', async () => {
      const customIdempotencyKey = 'custom-batch-uuid-12345';
      const batchRequest: PayoutBatchRequest = {
        referenceId: 'batch-ref',
        category: ['salary'],
        validateDestination: true,
        payouts: [
          {
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '0123456789',
          },
        ],
      };

      const mockResponse: Payout = {
        id: 'batch-id',
        referenceId: 'batch-ref',
        transactions: [
          {
            id: 'txn-id',
            referenceId: 'ref-1',
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

      const result = await payos.payouts.batch.create(batchRequest, customIdempotencyKey);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payouts/batch`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-idempotency-key': customIdempotencyKey,
          }),
        }),
      );
    });

    it('should create batch payout with PARTIAL_COMPLETED state', async () => {
      const batchRequest: PayoutBatchRequest = {
        referenceId: 'batch-ref-partial',
        category: ['salary'],
        validateDestination: true,
        payouts: [
          {
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout 1',
            toBin: '970422',
            toAccountNumber: '0123456789',
          },
          {
            referenceId: 'ref-2',
            amount: 3000,
            description: 'batch payout 2',
            toBin: '970422',
            toAccountNumber: '9999999999',
          },
        ],
      };

      const mockResponse: Payout = {
        id: 'batch-id-partial',
        referenceId: 'batch-ref-partial',
        transactions: [
          {
            id: 'txn-1',
            referenceId: 'ref-1',
            amount: 2000,
            description: 'batch payout 1',
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
            description: 'batch payout 2',
            toBin: '970422',
            toAccountNumber: '9999999999',
            toAccountName: null,
            reference: null,
            transactionDatetime: null,
            errorMessage: 'error message',
            errorCode: 'error code',
            state: 'FAILED',
          },
        ],
        category: ['salary'],
        approvalState: 'PARTIAL_COMPLETED',
        createdAt: '2025-12-12T09:00:00+07:00',
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
        createUuidv4: jest.fn().mockReturnValue('uuid'),
        createSignature: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.payouts.batch.create(batchRequest);

      expect(result).toEqual(mockResponse);
      expect(result.approvalState).toBe('PARTIAL_COMPLETED');
      expect(result.transactions[0].state).toBe('SUCCEEDED');
      expect(result.transactions[1].state).toBe('FAILED');
      expect(result.transactions[1].errorMessage).toBe('error message');
    });
  });
});
