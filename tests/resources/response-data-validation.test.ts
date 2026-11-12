import { PayOS, InvalidSignatureError, CreatePaymentLinkRequest } from '../../src';
import { NodeCryptoProvider } from '../../src/crypto';

describe('Validation of body-signed response data', () => {
  const CLIENT_ID = 'test-client-id';
  const API_KEY = 'test-api-key';
  const CHECKSUM_KEY = 'test-checksum-key';
  const BASE_URL = 'https://api-test.payos.vn';

  const crypto = new NodeCryptoProvider();
  let payos: PayOS;
  let mockFetch: jest.Mock;

  // Responds with `data` given as raw JSON text (so it can hold values such as `1e400`), signed with the
  // SDK's own signing helper over the parsed data, exactly as the API would sign it.
  const respondWith = (dataJson: string) => {
    mockFetch.mockImplementationOnce(async () => {
      const signature = await crypto.createSignatureFromObj(JSON.parse(dataJson), CHECKSUM_KEY);
      return new Response(
        `{"code":"00","desc":"success","data":${dataJson},"signature":${JSON.stringify(signature)}}`,
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
  };

  beforeEach(() => {
    mockFetch = jest.fn();
    payos = new PayOS({
      clientId: CLIENT_ID,
      apiKey: API_KEY,
      checksumKey: CHECKSUM_KEY,
      baseURL: BASE_URL,
      maxRetries: 0,
      fetch: mockFetch,
    });
  });

  const transaction = {
    reference: 'FT25001123456789',
    amount: 2000,
    accountNumber: '0123456789',
    description: 'CSUQCBM5F2 Thanh toán đơn hàng 123456 - Cà phê & bánh',
    transactionDateTime: '2025-01-01 10:05:00',
    virtualAccountName: null,
    virtualAccountNumber: null,
    counterAccountBankId: '970422',
    counterAccountBankName: 'MB Bank',
    counterAccountName: 'NGUYEN VAN A',
    counterAccountNumber: '9876543210',
  };

  const paymentLink = {
    id: 'a1b2c3d4e5f64789a0b1c2d3e4f5a6b7',
    orderCode: 123456,
    amount: 2000,
    amountPaid: 2000,
    amountRemaining: 0,
    status: 'PAID',
    createdAt: '2025-01-01T10:00:00+07:00',
    transactions: [transaction],
    cancellationReason: null,
    canceledAt: null,
  };

  const invoicesInfo = {
    invoices: [
      {
        invoiceId: 'b3c4d5e6f7a84901b2c3d4e5f6a7b8c9',
        invoiceNumber: '00000123',
        issuedTimestamp: 1735700400,
        issuedDatetime: '2025-01-01T10:00:00+07:00',
        transactionId: 'FT25001123456789',
        reservationCode: 'M1A2B3C4D5',
        codeOfTax: '00A1B2C3D4E5F6A7B8C9D0E1F2',
      },
    ],
  };

  const expectRejection = async (promise: Promise<unknown>, reason: string) => {
    const error = await promise.catch((err: unknown) => err);
    expect(error).toBeInstanceOf(InvalidSignatureError);
    expect((error as Error).message).toBe(`Invalid response data: ${reason}`);
  };

  describe('accepted data', () => {
    it('accepts a realistic payment link with a correct signature', async () => {
      respondWith(JSON.stringify(paymentLink));

      await expect(payos.paymentRequests.get(123456)).resolves.toEqual(paymentLink);
    });

    it('accepts a realistic cancelled payment link with a correct signature', async () => {
      const cancelled = {
        ...paymentLink,
        amountPaid: 0,
        amountRemaining: 2000,
        status: 'CANCELLED',
        transactions: [],
        cancellationReason: 'Khách hàng hủy đơn',
        canceledAt: '2025-01-01T10:10:00+07:00',
      };
      respondWith(JSON.stringify(cancelled));

      await expect(payos.paymentRequests.cancel(123456, 'Khách hàng hủy đơn')).resolves.toEqual(cancelled);
    });

    it('accepts a realistic invoice list with a correct signature', async () => {
      respondWith(JSON.stringify(invoicesInfo));

      await expect(payos.paymentRequests.invoices.get({ orderCode: 123456 })).resolves.toEqual(invoicesInfo);
    });

    it('accepts a realistic created payment link with a correct signature', async () => {
      const request: CreatePaymentLinkRequest = {
        orderCode: 123456,
        amount: 2000,
        description: 'Thanh toan don hang',
        cancelUrl: 'https://merchant.example/cancel?order=123456&lang=vi',
        returnUrl: 'https://merchant.example/return?order=123456&lang=vi',
      };
      const created = {
        bin: '970422',
        accountNumber: '113366668888',
        accountName: 'NGUYEN VAN A',
        amount: 2000,
        description: 'CSUQCBM5F2 Thanh toan don hang',
        orderCode: 123456,
        currency: 'VND',
        paymentLinkId: 'a1b2c3d4e5f64789a0b1c2d3e4f5a6b7',
        status: 'PENDING',
        expiredAt: 1735704000,
        checkoutUrl: 'https://pay.payos.vn/web/a1b2c3d4e5f64789a0b1c2d3e4f5a6b7',
        qrCode: '00020101021238570010A000000727012700069704220113113366668888020899999999',
      };
      respondWith(JSON.stringify(created));

      await expect(payos.paymentRequests.create(request)).resolves.toEqual(created);
    });

    it('still rejects a correctly shaped payload whose signature does not match', async () => {
      mockFetch.mockImplementationOnce(
        async () =>
          new Response(JSON.stringify({ code: '00', desc: 'success', data: paymentLink, signature: 'abc' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      );

      const error = await payos.paymentRequests.get(123456).catch((err: unknown) => err);
      expect(error).toBeInstanceOf(InvalidSignatureError);
      expect((error as Error).message).toBe('Data integrity check failed');
    });
  });

  describe('ampersand-key sequence', () => {
    it('rejects a top-level string containing "&key=" even with a matching signature', async () => {
      respondWith(JSON.stringify({ ...paymentLink, cancellationReason: 'none&status=PAID' }));

      await expectRejection(
        payos.paymentRequests.get(123456),
        '"cancellationReason" must not contain a "&key=" sequence',
      );
    });

    it('rejects a string inside an array entry containing "&key=" even with a matching signature', async () => {
      respondWith(
        JSON.stringify({
          ...paymentLink,
          transactions: [{ ...transaction, description: 'order 1&amountPaid=2000' }],
        }),
      );

      await expectRejection(
        payos.paymentRequests.cancel(123456),
        '"transactions[0].description" must not contain a "&key=" sequence',
      );
    });

    it('rejects an invoice field containing "&key=" even with a matching signature', async () => {
      respondWith(
        JSON.stringify({ invoices: [{ ...invoicesInfo.invoices[0], invoiceNumber: '1&invoiceId=2' }] }),
      );

      await expectRejection(
        payos.paymentRequests.invoices.get({ paymentLinkId: 'a1b2c3d4e5f64789a0b1c2d3e4f5a6b7' }),
        '"invoices[0].invoiceNumber" must not contain a "&key=" sequence',
      );
    });

    it('rejects a scalar array item containing "&key="', async () => {
      respondWith(JSON.stringify({ ...paymentLink, tags: ['a&status=PAID'] }));

      await expectRejection(
        payos.paymentRequests.get(123456),
        '"tags[0]" must not contain a "&key=" sequence',
      );
    });
  });

  describe('keys', () => {
    it.each([
      ['a key with a hyphen', '{"order-code":1}', 'unsupported key "order-code"'],
      ['a key with "="', '{"a=b":1}', 'unsupported key "a=b"'],
      ['a key with "&"', '{"a&b":1}', 'unsupported key "a&b"'],
      ['an empty key', '{"":1}', 'unsupported key ""'],
      ['a "__proto__" key', '{"__proto__":"x","id":"1"}', 'unsupported key "__proto__"'],
      ['a key with a space inside an array entry', '{"items":[{"a b":1}]}', 'unsupported key "items[0].a b"'],
      [
        'a "__proto__" key inside an array entry',
        '{"items":[{"__proto__":1}]}',
        'unsupported key "items[0].__proto__"',
      ],
    ])('rejects %s', async (_label, dataJson, reason) => {
      respondWith(dataJson);

      await expectRejection(payos.paymentRequests.get(123456), reason);
    });
  });

  describe('nesting', () => {
    it.each([
      ['a top-level object', '{"id":"1","meta":{"a":1}}', '"meta" has an unsupported type'],
      [
        'an object inside an array entry',
        '{"items":[{"meta":{"a":1}}]}',
        '"items[0].meta" has an unsupported type',
      ],
      [
        'an array inside an array entry',
        '{"items":[{"list":[1]}]}',
        '"items[0].list" has an unsupported type',
      ],
      ['an array inside an array', '{"items":[[1]]}', '"items[0]" has an unsupported type'],
    ])('rejects %s', async (_label, dataJson, reason) => {
      respondWith(dataJson);

      await expectRejection(payos.paymentRequests.get(123456), reason);
    });

    it.each([
      ['an array', '[{"id":"1"}]'],
      ['a string', '"id=1&amount=2"'],
      ['a number', '1'],
      ['true', 'true'],
    ])('rejects data that is %s', async (_label, dataJson) => {
      respondWith(dataJson);

      await expectRejection(payos.paymentRequests.get(123456), 'data must be a JSON object');
    });
  });

  describe('numbers', () => {
    const reason = (path: string) => `"${path}" must be a finite number within the safe integer range`;

    it.each([
      ['an overflowing number', '{"amount":1e400}', reason('amount')],
      ['a negative overflowing number', '{"amount":-1e400}', reason('amount')],
      ['an integer above 2^53-1', '{"orderCode":9007199254740993}', reason('orderCode')],
      ['an integer below -(2^53-1)', '{"orderCode":-9007199254740993}', reason('orderCode')],
      [
        'an unsafe integer inside an array entry',
        '{"items":[{"amount":9007199254740993}]}',
        reason('items[0].amount'),
      ],
      ['an overflowing number as an array item', '{"items":[1e400]}', reason('items[0]')],
    ])('rejects %s', async (_label, dataJson, message) => {
      respondWith(dataJson);

      await expectRejection(payos.paymentRequests.get(123456), message);
    });

    it('accepts the largest safe integer and fractional amounts', async () => {
      const data = { orderCode: Number.MAX_SAFE_INTEGER, amount: 2000.5, fee: -1 };
      respondWith(JSON.stringify(data));

      await expect(payos.paymentRequests.get(123456)).resolves.toEqual(data);
    });
  });
});
