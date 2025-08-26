import { GenericPage, Pagination } from '../../../core/pagination';
import { FinalRequestOptions, RequestOptions } from '../../../core/request-options';
import { APIResource } from '../../../core/resource';
import { PayoutBatchRequest, Batch } from './batch';

export class Payouts extends APIResource {
  /**
   * Create a new payout.
   *
   * @param {PayoutRequest} payoutData The details of the payout to be created.
   * @param {string|undefined} idempotencyKey A unique key for ensuring idempotency.
   *   Use a UUID or other high-entropy string so that retries of the
   *   same request are recognized and duplicated payouts are prevented.
   * @param {RequestOptions<PayoutBatchRequest>} options Additional options.
   * @returns {Promise<Payout>}  A promise that resolves to the newly created `Payout` object.
   */
  async create(
    payoutData: PayoutRequest,
    idempotencyKey: string = this._client.crypto.createUuidv4(),
    options?: RequestOptions<PayoutRequest>,
  ): Promise<Payout> {
    const data = await this._client.post<Payout, PayoutRequest>('/v1/payouts/', {
      ...options,
      body: payoutData,
      signatureOpts: { response: 'header', request: 'header' },
      headers: {
        'x-idempotency-key': idempotencyKey,
      },
    });

    return data;
  }

  /**
   * Retrieves detailed information about a specific payout.
   *
   * @param {string} payoutId The unique identifier of the payout to retrieve.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<Payout>} A promise that resolves to a `Payout` object containing the payout’s details.
   */
  async get(payoutId: string, options?: RequestOptions): Promise<Payout> {
    const data = await this._client.get<Payout>(`/v1/payouts/${payoutId}`, {
      ...options,
      signatureOpts: { response: 'header' },
    });

    return data;
  }

  /**
   * Estimate credit required for one or multiple payouts.
   *
   * @param {PayoutRequest|PayoutBatchRequest} payoutData The payout details—either a single payout request or a batch of them.
   * @param {RequestOptions<PayoutRequest|PayoutBatchRequest>} options Additional options.
   * @returns {Promise<EstimateCredit>} A promise resolving to an object containing the estimated credit required.
   */
  async estimateCredit(
    payoutData: PayoutRequest | PayoutBatchRequest,
    options?: RequestOptions<PayoutRequest | PayoutBatchRequest>,
  ): Promise<EstimateCredit> {
    const data = await this._client.post<EstimateCredit, PayoutRequest | PayoutBatchRequest>(
      '/v1/payouts/estimate-credit',
      {
        ...options,
        body: payoutData,
        signatureOpts: { request: 'header' },
      },
    );

    return data;
  }

  /**
   * Retrieves a paginated list of payouts filtered by the given criteria.
   *
   * @param {GetPayoutListParam} [params={ limit: 10, offset: 0 }] The filtering options including pagination parameters.
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<GenericPage<Payout>>} A promise that resolves with a page of payouts matching the specified criteria.
   */
  async list(
    params: GetPayoutListParam = { limit: 10, offset: 0 },
    options?: RequestOptions,
  ): Promise<GenericPage<Payout>> {
    // Convert Date objects to ISO strings for API
    const processedParams: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value instanceof Date) {
        processedParams[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        processedParams[key] = value.join(',');
      } else if (value) {
        processedParams[key] = value;
      }
    });

    const finalOptions: FinalRequestOptions = {
      ...options,
      path: '/v1/payouts',
      method: 'GET',
      query: processedParams,
      signatureOpts: { response: 'header' },
    };

    const data = await this._client.request<PayoutListResponse>(finalOptions);
    return new GenericPage<Payout>(this._client, data, finalOptions);
  }

  batch: Batch = new Batch(this._client);
}

export type PayoutTransactionState =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'CANCELLED'
  | 'SUCCEEDED'
  | 'ON_HOLD'
  | 'REVERSED'
  | 'FAILED';

export type PayoutApprovalState =
  | 'DRAFTING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'FAILED'
  | 'PARTIAL_COMPLETED'
  | 'COMPLETED';

export type PayoutRequest = {
  reference_id: string;
  amount: number;
  description: string;
  to_bin: string;
  to_account_number: string;
  category?: string[];
};

export type PayoutTransaction = {
  id: string;
  referenceId: string;
  amount: number;
  description: string;
  toBin: string;
  toAccountNumber: string;
  toAccountName: string | null;
  reference: string | null;
  transactionDatetime: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  state: PayoutTransactionState;
};

export type Payout = {
  id: string;
  referenceId: string;
  transactions: PayoutTransaction[];
  category: string[] | null;
  approvalState: PayoutApprovalState;
  createdAt: string;
};

export type EstimateCredit = {
  estimateCredit: number;
};

export type GetPayoutListParam = {
  referenceId?: string;
  approvalState?: PayoutApprovalState;
  category?: string[];
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
};

export type PayoutListResponse = {
  pagination: Pagination;
  payouts: Payout[];
};
