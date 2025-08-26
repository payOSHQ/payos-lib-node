import { RequestOptions } from '../../../core/request-options';
import { APIResource } from '../../../core/resource';
import { Invoices } from './invoices';

export class PaymentRequests extends APIResource {
  /**
   * Creates a payment link for the provided order data.
   *
   * @param {CreatePaymentLinkRequest} paymentData The details of payment link to be created.
   * @param {RequestOptions<CreatePaymentLinkRequest>} options Additional options.
   * @returns {Promise<CreatePaymentLinkResponse>}
   *   A promise resolving to a `CreatePaymentLinkResponse` object containing the payment link detail.
   *
   */
  async create(
    paymentData: CreatePaymentLinkRequest,
    options?: RequestOptions<CreatePaymentLinkRequest>,
  ): Promise<CreatePaymentLinkResponse> {
    const data = await this._client.post<CreatePaymentLinkResponse, CreatePaymentLinkRequest>(
      '/v2/payment-requests',
      {
        ...options,
        body: paymentData,
        signatureOpts: { request: 'create-payment-link', response: 'body' },
      },
    );

    return data;
  }

  /**
   * Retrieve payment link information from payment link ID.
   *
   * @param {string} paymentLinkId The payment link ID.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<PaymentLink>} A promise resolving to a `PaymentLink` object containing the payment link detail.
   */
  async get(paymentLinkId: string, options?: RequestOptions): Promise<PaymentLink>;
  /**
   * Retrieve payment link information from order code.
   *
   * @param {number} orderCode The order code.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<PaymentLink>} A promise resolving to a `PaymentLink` object containing the payment link detail.
   */
  async get(orderCode: number, options?: RequestOptions): Promise<PaymentLink>;
  async get(id: string | number, options?: RequestOptions): Promise<PaymentLink> {
    const data = await this._client.get<PaymentLink>(`/v2/payment-requests/${id}`, {
      ...options,
      signatureOpts: { response: 'body' },
    });

    return data;
  }

  /**
   * Cancel a payment link by payment link ID.
   *
   * @param {string} paymentLinkId The payment link ID.
   * @param {string|undefined} cancellationReason The cancellation reason.
   * @param {RequestOptions<CancelPaymentLinkRequest>} options Additional options.
   * @returns {Promise<PaymentLink>} A promise resolving to a `PaymentLink` object containing the payment link detail.
   */
  async cancel(
    paymentLinkId: string,
    cancellationReason?: string,
    options?: RequestOptions<CancelPaymentLinkRequest>,
  ): Promise<PaymentLink>;
  /**
   * Cancel a payment link by order code.
   *
   * @param {string} orderCode The order code.
   * @param {string|undefined} cancellationReason The cancellation reason.
   * @param {RequestOptions<CancelPaymentLinkRequest>} options Additional options.
   * @returns {Promise<PaymentLink>} A promise resolving to a `PaymentLink` object containing the payment link detail.
   */
  async cancel(
    orderCode: number,
    cancellationReason?: string,
    options?: RequestOptions<CancelPaymentLinkRequest>,
  ): Promise<PaymentLink>;
  async cancel(
    id: string | number,
    cancellationReason?: string,
    options?: RequestOptions<CancelPaymentLinkRequest>,
  ): Promise<PaymentLink> {
    const requestData: CancelPaymentLinkRequest | undefined =
      cancellationReason ? { cancellationReason: cancellationReason } : undefined;

    const data = await this._client.post<PaymentLink, CancelPaymentLinkRequest>(
      `/v2/payment-requests/${id}/cancel`,
      {
        ...options,
        body: requestData,
        signatureOpts: { response: 'body' },
      },
    );

    return data;
  }

  invoices: Invoices = new Invoices(this._client);
}

export type PaymentLinkStatus =
  | 'PENDING'
  | 'CANCELLED'
  | 'UNDERPAID'
  | 'PAID'
  | 'EXPIRED'
  | 'PROCESSING'
  | 'FAILED';

export type TaxPercentage = -2 | -1 | 0 | 5 | 10;

export type PaymentLinkItem = {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  taxPercentage?: TaxPercentage;
};

export type InvoiceRequest = {
  buyerNotGetInvoice?: boolean;
  taxPercentage?: TaxPercentage;
};

export type CreatePaymentLinkRequest = {
  orderCode: number;
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  signature?: string;
  items?: PaymentLinkItem[];
  buyerName?: string;
  buyerCompanyName?: string;
  buyerTaxCode?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  invoice?: InvoiceRequest;
  expiredAt?: number;
};

export type CreatePaymentLinkResponse = {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: PaymentLinkStatus;
  expiredAt?: number;
  checkoutUrl: string;
  qrCode: string;
};

export type CancelPaymentLinkRequest = {
  cancellationReason?: string;
};

export type PaymentLink = {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: PaymentLinkStatus;
  createdAt: string;
  transactions: Transaction[];
  cancellationReason: string | null;
  canceledAt: string | null;
};

export type Transaction = {
  reference: string;
  amount: number;
  accountNumber: string;
  description: string;
  transactionDateTime: string;
  virtualAccountName: string | null;
  virtualAccountNumber: string | null;
  counterAccountBankId: string | null;
  counterAccountBankName: string | null;
  counterAccountName: string | null;
  counterAccountNumber: string | null;
};
