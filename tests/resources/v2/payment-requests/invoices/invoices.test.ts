import { PayOS, InvoicesInfo } from '../../../../../src';

describe('Invoices', () => {
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

  describe('get()', () => {
    it('should get invoices by payment link ID with single invoice', async () => {
      const paymentLinkId = 'payment-link-id';
      const mockInvoicesInfo = {
        invoices: [
          {
            invoiceId: 'invoice-id',
            invoiceNumber: 'INV-001',
            issuedTimestamp: 1765504800,
            issuedDatetime: '2025-12-12T02:00:00.000Z',
            transactionId: 'txn-id',
            reservationCode: 'RES-CODE',
            codeOfTax: 'TAX-CODE',
          },
        ],
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockInvoicesInfo,
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

      const result = await payos.paymentRequests.invoices.get({ paymentLinkId });

      expect(result).toEqual(mockInvoicesInfo);
      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].invoiceNumber).toBe('INV-001');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${paymentLinkId}/invoices`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should get invoices by order code', async () => {
      const orderCode = 12345;
      const mockInvoicesInfo = {
        invoices: [
          {
            invoiceId: 'invoice-id',
            invoiceNumber: 'INV-002',
            issuedTimestamp: 1765504800,
            issuedDatetime: '2025-12-12T02:00:00.000Z',
            transactionId: 'txn-id',
            reservationCode: 'RES-CODE',
            codeOfTax: 'TAX-CODE',
          },
        ],
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockInvoicesInfo,
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

      const result = await payos.paymentRequests.invoices.get({ orderCode });

      expect(result).toEqual(mockInvoicesInfo);
      expect(result.invoices[0].invoiceNumber).toBe('INV-002');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${orderCode}/invoices`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should get invoices with multiple invoices', async () => {
      const paymentLinkId = 'payment-link-id';
      const mockInvoicesInfo = {
        invoices: [
          {
            invoiceId: 'invoice-1',
            invoiceNumber: 'INV-001',
            issuedTimestamp: 1765504800,
            issuedDatetime: '2025-12-12T02:00:00.000Z',
            transactionId: 'txn-1',
            reservationCode: 'RES-1',
            codeOfTax: 'TAX-1',
          },
          {
            invoiceId: 'invoice-2',
            invoiceNumber: null,
            issuedTimestamp: null,
            issuedDatetime: null,
            transactionId: null,
            reservationCode: null,
            codeOfTax: null,
          },
        ],
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockInvoicesInfo,
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

      const result = await payos.paymentRequests.invoices.get({ paymentLinkId });

      expect(result).toEqual(mockInvoicesInfo);
      expect(result.invoices).toHaveLength(2);
      expect(result.invoices[0].invoiceNumber).toBe('INV-001');
      expect(result.invoices[1].invoiceNumber).toBeNull();
    });

    it('should get empty invoices list', async () => {
      const paymentLinkId = 'payment-link-id';
      const mockInvoicesInfo: InvoicesInfo = {
        invoices: [],
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: mockInvoicesInfo,
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

      const result = await payos.paymentRequests.invoices.get({ paymentLinkId });

      expect(result).toEqual(mockInvoicesInfo);
      expect(result.invoices).toHaveLength(0);
    });
  });

  describe('download()', () => {
    it('should download invoice by payment link ID', async () => {
      const invoiceId = 'invoice-id';
      const paymentLinkId = 'payment-link-id';
      const mockPdfData = Buffer.from('mock-pdf-data');

      mockFetch.mockImplementationOnce(async () => {
        return new Response(mockPdfData, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="invoice.pdf"',
          },
        });
      });

      const result = await payos.paymentRequests.invoices.download(invoiceId, { paymentLinkId });

      expect(result).toBeInstanceOf(Object);
      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('invoice.pdf');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${paymentLinkId}/invoices/${invoiceId}/download`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should download invoice by order code', async () => {
      const invoiceId = 'invoice-id';
      const orderCode = 12345;
      const mockPdfData = Buffer.from('mock-pdf-data');

      mockFetch.mockImplementationOnce(async () => {
        return new Response(mockPdfData, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="invoice-12345.pdf"',
          },
        });
      });

      const result = await payos.paymentRequests.invoices.download(invoiceId, { orderCode });

      expect(result).toBeInstanceOf(Object);
      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('invoice-12345.pdf');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/v2/payment-requests/${orderCode}/invoices/${invoiceId}/download`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should download invoice with different content type', async () => {
      const invoiceId = 'invoice-id';
      const paymentLinkId = 'payment-link-id';
      const mockData = Buffer.from('mock-data');

      mockFetch.mockImplementationOnce(async () => {
        return new Response(mockData, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="document.bin"',
          },
        });
      });

      const result = await payos.paymentRequests.invoices.download(invoiceId, { paymentLinkId });

      expect(result.contentType).toBe('application/octet-stream');
      expect(result.filename).toBe('document.bin');
    });

    it('should download invoice without filename in header', async () => {
      const invoiceId = 'invoice-id';
      const paymentLinkId = 'payment-link-id';
      const mockPdfData = Buffer.from('mock-pdf-data');

      mockFetch.mockImplementationOnce(async () => {
        return new Response(mockPdfData, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
          },
        });
      });

      const result = await payos.paymentRequests.invoices.download(invoiceId, { paymentLinkId });

      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBeUndefined();
    });
  });
});
