import { FileDownloadResponse } from '../../../../core/api-response';
import { RequestOptions } from '../../../../core/request-options';
import { APIResource } from '../../../../core/resource';

export class Invoices extends APIResource {
  /**
   * Retrieve invoices of a payment link by payment link ID.
   *
   * @param {InvoiceRetrieveParamsByPaymentLinkId} params Params required to retrieve invoices.
   * @param {string} params.paymentLinkId Payment link ID.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<InvoicesInfo>} A promise resolve to `InvoicesInfo` object contain invoices of current payment link.
   */
  async get(params: InvoiceRetrieveParamsByPaymentLinkId, options?: RequestOptions): Promise<InvoicesInfo>;
  /**
   * Retrieve invoices of a payment link by order code.
   *
   * @param {InvoiceRetrieveParamsByOrderCode} params Params required to retrieve invoices.
   * @param {number} params.orderCode Order code.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<InvoicesInfo>} A promise resolve to `InvoicesInfo` object contain invoices of current payment link.
   */
  async get(params: InvoiceRetrieveParamsByOrderCode, options?: RequestOptions): Promise<InvoicesInfo>;
  async get(params: InvoiceRetrieveParams, options?: RequestOptions): Promise<InvoicesInfo> {
    const id = 'paymentLinkId' in params ? params.paymentLinkId : params.orderCode;
    const data = await this._client.get<InvoicesInfo>(`/v2/payment-requests/${id}/invoices`, {
      signatureOpts: { response: 'body' },
      ...options,
    });

    return data;
  }

  /**
   * Download an invoice in PDF format by payment link ID.
   *
   * @param {string} invoiceId Invoice ID.
   * @param {InvoiceDownloadParamsByPaymentLinkId} params Params required to download invoice.
   * @param {string} params.paymentLinkId Payment link ID.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<FileDownloadResponse>} The invoice file in PDF format.
   */
  async download(
    invoiceId: string,
    params: InvoiceDownloadParamsByPaymentLinkId,
    options?: RequestOptions,
  ): Promise<FileDownloadResponse>;
  /**
   * Download an invoice in PDF format by order code.
   *
   * @param {string} invoiceId Invoice ID.
   * @param {InvoiceDownloadParamsByOrderCode} params Params required to download invoice.
   * @param {number} params.orderCode Order code.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<FileDownloadResponse>} The invoice file in PDF format.
   */
  async download(
    invoiceId: string,
    params: InvoiceDownloadParamsByOrderCode,
    options?: RequestOptions,
  ): Promise<FileDownloadResponse>;
  async download(
    invoiceId: string,
    params: InvoiceDownloadParams,
    options?: RequestOptions,
  ): Promise<FileDownloadResponse> {
    const id = 'paymentLinkId' in params ? params.paymentLinkId : params.orderCode;
    const fileResponse = await this._client.downloadFile({
      path: `/v2/payment-requests/${id}/invoices/${invoiceId}/download`,
      method: 'GET',
      ...options,
    });

    return fileResponse;
  }
}

export type Invoice = {
  invoiceId: string;
  invoiceNumber: string | null;
  issuedTimestamp: number | null;
  issuedDatetime: Date | null;
  transactionId: string | null;
  reservationCode: string | null;
  codeOfTax: string | null;
};

export type InvoicesInfo = {
  invoices: Invoice[];
};

export type InvoiceRetrieveParamsByPaymentLinkId = {
  paymentLinkId: string;
};

export type InvoiceRetrieveParamsByOrderCode = {
  orderCode: number;
};

export type InvoiceRetrieveParams = InvoiceRetrieveParamsByPaymentLinkId | InvoiceRetrieveParamsByOrderCode;

export type InvoiceDownloadParamsByPaymentLinkId = {
  paymentLinkId: string;
};

export type InvoiceDownloadParamsByOrderCode = {
  orderCode: number;
};

export type InvoiceDownloadParams = InvoiceDownloadParamsByPaymentLinkId | InvoiceDownloadParamsByOrderCode;
