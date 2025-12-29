import { PayOS, CreatePaymentLinkRequest, CreatePaymentLinkResponse, PaymentLink } from '../../../../src';

describe('PaymentRequests', () => {
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
    it('should create payment link with minimal fields', async () => {
      const paymentRequest: CreatePaymentLinkRequest = {
        orderCode: 12345,
        amount: 2000,
        description: 'Test payment',
        cancelUrl: 'http://localhost/cancel',
        returnUrl: 'http://localhost/return',
      };

      const mockResponse: CreatePaymentLinkResponse = {
        bin: '970422',
        accountNumber: '0123456789',
        accountName: 'NGUYEN VAN A',
        amount: 2000,
        description: 'Test payment',
        orderCode: 12345,
        currency: 'VND',
        paymentLinkId: 'payment-link-id',
        status: 'PENDING',
        checkoutUrl: 'https://pay.payos.vn/payment-link-id',
        qrCode: 'qrcode',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockResponse,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureOfPaymentRequest: jest.fn().mockResolvedValue('mock-signature'),
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.create(paymentRequest);

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('PENDING');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests`,
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should create payment link with full fields including items and invoice', async () => {
      const paymentRequest: CreatePaymentLinkRequest = {
        orderCode: 12345,
        amount: 3300,
        description: 'Full fields payment',
        cancelUrl: 'http://localhost/cancel',
        returnUrl: 'http://localhost/return',
        buyerName: 'buyer name',
        buyerCompanyName: 'company name',
        buyerTaxCode: '0316794479',
        buyerEmail: 'buyer@email.com',
        buyerPhone: '0123456789',
        buyerAddress: 'buyer address',
        items: [
          { name: 'product 1', quantity: 1, price: 1000, unit: 'piece', taxPercentage: 10 },
          { name: 'product 2', quantity: 1, price: 2000, unit: 'piece', taxPercentage: 10 },
        ],
        invoice: { buyerNotGetInvoice: false, taxPercentage: 10 },
      };

      const mockResponse: CreatePaymentLinkResponse = {
        bin: '970422',
        accountNumber: '0123456789',
        accountName: 'NGUYEN VAN A',
        amount: 3300,
        description: 'Full fields payment',
        orderCode: 12345,
        currency: 'VND',
        paymentLinkId: 'payment-link-id',
        status: 'PENDING',
        checkoutUrl: 'https://pay.payos.vn/payment-link-id',
        qrCode: 'qrcode',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockResponse,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureOfPaymentRequest: jest.fn().mockResolvedValue('mock-signature'),
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.create(paymentRequest);

      expect(result).toEqual(mockResponse);
      expect(result.amount).toBe(3300);
    });
  });

  describe('get()', () => {
    it('should get payment link by payment link ID', async () => {
      const paymentLinkId = 'payment-link-id';
      const mockPaymentLink: PaymentLink = {
        id: paymentLinkId,
        orderCode: 12345,
        amount: 2000,
        amountPaid: 2000,
        amountRemaining: 0,
        status: 'PAID',
        createdAt: '2025-12-12T09:00:00+07:00',
        transactions: [
          {
            reference: 'FT-REFERENCE',
            amount: 2000,
            accountNumber: '0123456789',
            description: 'Payment',
            transactionDateTime: '2025-12-12T09:00:00+07:00',
            virtualAccountName: null,
            virtualAccountNumber: null,
            counterAccountBankId: '01202001',
            counterAccountBankName: null,
            counterAccountName: 'NGUYEN VAN A',
            counterAccountNumber: '9876543210',
          },
        ],
        cancellationReason: null,
        canceledAt: null,
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockPaymentLink,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.get(paymentLinkId);

      expect(result).toEqual(mockPaymentLink);
      expect(result.status).toBe('PAID');
      expect(result.transactions).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${paymentLinkId}`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should get payment link by order code', async () => {
      const orderCode = 12345;
      const mockPaymentLink: PaymentLink = {
        id: 'payment-link-id',
        orderCode: orderCode,
        amount: 2000,
        amountPaid: 0,
        amountRemaining: 2000,
        status: 'PENDING',
        createdAt: '2025-12-12T09:00:00+07:00',
        transactions: [],
        cancellationReason: null,
        canceledAt: null,
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockPaymentLink,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.get(orderCode);

      expect(result).toEqual(mockPaymentLink);
      expect(result.orderCode).toBe(orderCode);
      expect(result.status).toBe('PENDING');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${orderCode}`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should get payment link with EXPIRED status', async () => {
      const paymentLinkId = 'expired-link';
      const mockPaymentLink: PaymentLink = {
        id: paymentLinkId,
        orderCode: 12345,
        amount: 2000,
        amountPaid: 0,
        amountRemaining: 2000,
        status: 'EXPIRED',
        createdAt: '2025-12-12T09:00:00+07:00',
        transactions: [],
        cancellationReason: null,
        canceledAt: null,
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockPaymentLink,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.get(paymentLinkId);

      expect(result).toEqual(mockPaymentLink);
      expect(result.status).toBe('EXPIRED');
    });
  });

  describe('cancel()', () => {
    it('should cancel payment link by payment link ID without reason', async () => {
      const paymentLinkId = 'payment-link-id';
      const mockCancelledLink: PaymentLink = {
        id: paymentLinkId,
        orderCode: 12345,
        amount: 2000,
        amountPaid: 0,
        amountRemaining: 2000,
        status: 'CANCELLED',
        createdAt: '2025-12-12T09:00:00+07:00',
        transactions: [],
        cancellationReason: null,
        canceledAt: '2025-12-12T10:00:00+07:00',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockCancelledLink,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.cancel(paymentLinkId);

      expect(result).toEqual(mockCancelledLink);
      expect(result.status).toBe('CANCELLED');
      expect(result.cancellationReason).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${paymentLinkId}/cancel`,
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should cancel payment link by payment link ID with reason', async () => {
      const paymentLinkId = 'payment-link-id';
      const cancellationReason = 'Customer requested cancellation';
      const mockCancelledLink: PaymentLink = {
        id: paymentLinkId,
        orderCode: 12345,
        amount: 2000,
        amountPaid: 0,
        amountRemaining: 2000,
        status: 'CANCELLED',
        createdAt: '2025-12-12T09:00:00+07:00',
        transactions: [],
        cancellationReason: cancellationReason,
        canceledAt: '2025-12-12T10:00:00+07:00',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockCancelledLink,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.cancel(paymentLinkId, cancellationReason);

      expect(result).toEqual(mockCancelledLink);
      expect(result.cancellationReason).toBe(cancellationReason);
    });

    it('should cancel payment link by order code', async () => {
      const orderCode = 12345;
      const mockCancelledLink: PaymentLink = {
        id: 'payment-link-id',
        orderCode: orderCode,
        amount: 2000,
        amountPaid: 0,
        amountRemaining: 2000,
        status: 'CANCELLED',
        createdAt: '2025-12-12T09:00:00+07:00',
        transactions: [],
        cancellationReason: null,
        canceledAt: '2025-12-12T10:00:00+07:00',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockCancelledLink,
            signature: 'mock-signature',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue('mock-signature'),
      };

      const result = await payos.paymentRequests.cancel(orderCode);

      expect(result).toEqual(mockCancelledLink);
      expect(result.orderCode).toBe(orderCode);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${orderCode}/cancel`,
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });
});
