import { RequestOptions } from '../../../../core/request-options';
import { APIResource } from '../../../../core/resource';
import { Payout } from '../payouts';

export class Batch extends APIResource {
  /**
   * Create a batch payout.
   *
   * @param {PayoutBatchRequest} payoutData The details of batch payout to be created.
   * @param {string|undefined} idempotencyKey A unique key for ensuring idempotency.
   * @param {RequestOptions<PayoutBatchRequest>} options Additional options.
   * @returns {Promise<Payout>} A promise that resolves to the newly created `Payout` object.
   */
  async create(
    payoutData: PayoutBatchRequest,
    idempotencyKey: string = this._client.crypto.createUuidv4(),
    options?: RequestOptions<PayoutBatchRequest>,
  ): Promise<Payout> {
    const data = await this._client.post<Payout, PayoutBatchRequest>('/v1/payouts/batch', {
      signatureOpts: {
        request: 'header',
        response: 'header',
      },
      body: payoutData,
      headers: {
        'x-idempotency-key': idempotencyKey,
      },
      ...options,
    });
    return data;
  }
}

export type PayoutBatchItem = {
  referenceId: string;
  amount: number;
  description: string;
  toBin: string;
  toAccountNumber: string;
};

export type PayoutBatchRequest = {
  referenceId: string;
  validateDestination?: boolean;
  category: string[] | null;
  payouts: PayoutBatchItem[];
};
