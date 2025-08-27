import { RequestOptions } from '../../../core/request-options';
import { APIResource } from '../../../core/resource';

export class PayoutsAccount extends APIResource {
  /**
   * Retrieves the current payout account balance.
   *
   * @param {RequestOptions} options Additional options.
   * @returns {Promise<PayoutAccountInfo>}
   *   A promise resolving to a `PayoutAccountInfo` object containing the current balance and related account details.
   */
  async balance(options?: RequestOptions): Promise<PayoutAccountInfo> {
    const data = await this._client.get<PayoutAccountInfo>(`/v1/payouts-account/balance`, {
      signatureOpts: { response: 'header' },
      ...options,
    });

    return data;
  }
}

export type PayoutAccountInfo = {
  accountNumber: string;
  accountName: string;
  currency: string;
  balance: string;
};
