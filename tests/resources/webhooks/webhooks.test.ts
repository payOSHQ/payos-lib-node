import { PayOS, WebhookData, Webhook } from '../../../src';

describe('Webhooks', () => {
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

  describe('verify()', () => {
    const validWebhookData: WebhookData = {
      accountNumber: '0123456789',
      amount: 20000,
      description: 'thanh toan',
      reference: 'FT-REFERENCE',
      transactionDateTime: '2025-12-12 09:00:00',
      virtualAccountNumber: '',
      counterAccountBankId: '01202001',
      counterAccountBankName: '',
      counterAccountName: 'NGUYEN VAN A',
      counterAccountNumber: '9876543210',
      virtualAccountName: '',
      currency: 'VND',
      orderCode: 0,
      paymentLinkId: 'payment-link-id',
      code: '00',
      desc: 'success',
    };

    const validSignature = 'mock-valid-signature';

    it('should verify valid webhook with correct signature', async () => {
      const webhook: Webhook = {
        code: '00',
        desc: 'success',
        success: true,
        data: validWebhookData,
        signature: validSignature,
      };

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue(validSignature),
      };

      const result = await payos.webhooks.verify(webhook);

      expect(result).toEqual(validWebhookData);
      expect((payos as any).crypto.createSignatureFromObj).toHaveBeenCalledWith(
        validWebhookData,
        CHECKSUM_KEY,
      );
    });

    it('should throw WebhookError when data is missing', async () => {
      const webhook: Webhook = {
        code: '00',
        desc: 'success',
        success: true,
        data: null as any,
        signature: validSignature,
      };

      await expect(payos.webhooks.verify(webhook)).rejects.toThrow('Invalid webhook data');
    });

    it('should throw WebhookError when data is undefined', async () => {
      const webhook: Webhook = {
        code: '00',
        desc: 'success',
        success: true,
        data: undefined as any,
        signature: validSignature,
      };

      await expect(payos.webhooks.verify(webhook)).rejects.toThrow('Invalid webhook data');
    });

    it('should throw WebhookError when signature is missing', async () => {
      const webhook: Webhook = {
        code: '00',
        desc: 'success',
        success: true,
        data: validWebhookData,
        signature: '' as any,
      };

      await expect(payos.webhooks.verify(webhook)).rejects.toThrow('Invalid signature');
    });

    it('should throw WebhookError when signature is undefined', async () => {
      const webhook: Webhook = {
        code: '00',
        desc: 'success',
        success: true,
        data: validWebhookData,
        signature: undefined as any,
      };

      await expect(payos.webhooks.verify(webhook)).rejects.toThrow('Invalid signature');
    });

    it('should throw WebhookError when signature does not match', async () => {
      const webhook: Webhook = {
        code: '00',
        desc: 'success',
        success: true,
        data: validWebhookData,
        signature: validSignature,
      };

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue('different-signature'),
      };

      await expect(payos.webhooks.verify(webhook)).rejects.toThrow('Data not integrity');
    });

    it('should throw WebhookError when crypto provider returns null', async () => {
      const webhook: Webhook = {
        code: '00',
        desc: 'success',
        success: true,
        data: validWebhookData,
        signature: validSignature,
      };

      (payos as any).crypto = {
        createSignatureFromObj: jest.fn().mockResolvedValue(null),
      };

      await expect(payos.webhooks.verify(webhook)).rejects.toThrow('Data not integrity');
    });
  });

  describe('confirm()', () => {
    const validWebhookUrl = 'https://example.com/webhook';

    it('should confirm webhook URL successfully', async () => {
      const expectedResponse = {
        webhookUrl: validWebhookUrl,
        accountNumber: '113366668888',
        accountName: 'QUY VAC XIN PHONG CHONG COVID',
        name: 'My Payment Channel',
        shortName: 'BIDV',
      };

      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '00',
            desc: 'success',
            data: expectedResponse,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      const result = await payos.webhooks.confirm(validWebhookUrl);

      expect(result).toEqual(expectedResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/confirm-webhook`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ webhookUrl: validWebhookUrl }),
        }),
      );
    });

    it('should throw WebhookError when webhook URL is empty', async () => {
      await expect(payos.webhooks.confirm('')).rejects.toThrow('Webhook URL invalid.');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw WebhookError when webhook URL is missing', async () => {
      await expect(payos.webhooks.confirm(null as any)).rejects.toThrow('Webhook URL invalid.');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw WebhookError when PayOS validation fails', async () => {
      mockFetch.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            code: '20',
            desc: 'Webhook url invalid',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

      await expect(payos.webhooks.confirm(validWebhookUrl)).rejects.toThrow('Webhook validation failed');
    });
  });
});
