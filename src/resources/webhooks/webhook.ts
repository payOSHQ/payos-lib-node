import { PayOSError, WebhookError } from '../../core/error';
import { RequestOptions } from '../../core/request-options';
import { APIResource } from '../core';

export class Webhooks extends APIResource {
  /**
   * Validate and register a webhook URL with PayOS.
   * PayOS will test the webhook endpoint by sending a validation request to it.
   * If the webhook responds correctly, it will be registered for payment notifications.
   *
   * @param {string} webhookUrl - Your webhook endpoint URL that will receive payment notifications
   * @param {RequestOptions<ConfirmWebhookRequest>} options Additional options.
   * @returns {Promise<ConfirmWebhookResponse>} The confirmed webhook URL result
   * @throws {PayOSError} When webhook URL is invalid or validation fails
   */
  async confirm(
    webhookUrl: string,
    options?: RequestOptions<ConfirmWebhookRequest>,
  ): Promise<ConfirmWebhookResponse> {
    if (!webhookUrl || webhookUrl.length === 0) {
      throw new WebhookError('Webhook URL invalid.');
    }

    try {
      const data = await this._client.post<ConfirmWebhookResponse, ConfirmWebhookRequest>(
        '/confirm-webhook',
        {
          ...options,
          body: { webhookUrl },
        },
      );

      return data;
    } catch (error: any) {
      // The error comes from PayOS API when validating the webhook URL
      // PayOS tests the webhook endpoint and reports back the validation result
      if (error instanceof PayOSError) {
        // Re-throw with more descriptive messages based on PayOS validation response
        throw new WebhookError(`Webhook validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Verify the webhook data sent from payOS.
   *
   * @param {Webhook} webhook The request body receive from payOS.
   * @returns {Promise<WebhookData>} The verified webhook data.
   */
  async verify(webhook: Webhook): Promise<WebhookData> {
    const { data, signature } = webhook;

    if (!data) {
      throw new WebhookError('Invalid webhook data');
    }

    if (!signature) {
      throw new WebhookError('Invalid signature');
    }

    const signedSignature = await this._client.crypto.createSignatureFromObj(data, this._client.checksumKey);

    if (!signedSignature || signedSignature !== signature) {
      throw new WebhookError('Data not integrity');
    }

    return data;
  }
}

export type ConfirmWebhookRequest = {
  webhookUrl: string;
};

export type ConfirmWebhookResponse = {
  webhookUrl: string;
  accountName: string;
  accountNumber: string;
  name: string;
  shortName: string;
};

export type Webhook = {
  code: string;
  desc: string;
  success: boolean;
  data: WebhookData;
  signature: string;
};

export type WebhookData = {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
};
