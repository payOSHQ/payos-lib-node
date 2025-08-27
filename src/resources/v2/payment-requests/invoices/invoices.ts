import { FileDownloadResponse } from '../../../../core/api-response';
import { RequestOptions } from '../../../../core/request-options';
import { APIResource } from '../../../../core/resource';

export class Invoices extends APIResource {
  /**
   * Retrieve invoices of a payment link.
   *
   * @param {InvoiceRetrieveParams} params Params required to retrieve invoices.
   * @param {string} params.paymentLinkId Payment link ID.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<InvoicesInfo>} A promise resolve to `InvoicesInfo` object contain invoices of current payment link.
   */
  async get(params: InvoiceRetrieveParams, options?: RequestOptions): Promise<InvoicesInfo> {
    const { paymentLinkId } = params;
    const data = await this._client.get<InvoicesInfo>(`/v2/payment-requests/${paymentLinkId}/invoices`, {
      signatureOpts: { response: 'body' },
      ...options,
    });

    return data;
  }

  /**
   * Download an invoice in PDF format.
   *
   * @param {string} invoiceId Invoice ID.
   * @param {InvoiceDownloadParams} params Params required to download invoice.
   * @param {string} params.paymentLinkId Payment link ID.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<FileDownloadResponse>} The invoice file in PDF format.
   */
  async download(
    invoiceId: string,
    params: InvoiceDownloadParams,
    options?: RequestOptions,
  ): Promise<FileDownloadResponse> {
    const { paymentLinkId } = params;
    const fileResponse = await this._client.downloadFile({
      path: `/v2/payment-requests/${paymentLinkId}/invoices/${invoiceId}/download`,
      method: 'GET',
      ...options,
    });

    return fileResponse;
  }
}

export type Invoice = {
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceTimestamp: number | null;
  invoiceDateTime: Date | null;
  transactionId: string | null;
  reservationCode: string | null;
  codeOfTax: string | null;
};

export type InvoicesInfo = {
  invoices: Invoice[];
};

export type InvoiceRetrieveParams = {
  paymentLinkId: string;
};

export type InvoiceDownloadParams = {
  paymentLinkId: string;
};
