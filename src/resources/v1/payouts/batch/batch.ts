import { RequestOptions } from '../../../../core/request-options';
import { APIResource } from '../../../../core/resource';
import { Payout } from '../payouts';

export class Batch extends APIResource {
  /**
   * Create a batch payout.
   *
   * @param {PayoutBatchRequest} payoutData The details of batch payout to be created.
   * @param {RequestOptions<PayoutBatchRequest>} options Additional options.
   * @returns {Promise<Payout>} A promise that resolves to the newly created `Payout` object.
   */
  async create(
    payoutData: PayoutBatchRequest,
    options?: RequestOptions<PayoutBatchRequest>,
  ): Promise<Payout> {
    const data = await this._client.post<Payout, PayoutBatchRequest>('/v1/payouts/batch', {
      ...options,
      signatureOpts: {
        request: 'header',
        response: 'header',
      },
      body: payoutData,
    });
    return data;
  }
}

export type PayoutBatchItem = {
  reference_id: string;
  amount: number;
  description: string;
  to_bin: string;
  to_account_number: string;
};

export type PayoutBatchRequest = {
  reference_id: string;
  validate_destination?: boolean;
  category: string[] | null;
  payouts: PayoutBatchItem[];
};
