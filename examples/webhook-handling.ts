import { PayOS, WebhookError, Webhook } from '@payos/node';
import 'dotenv/config';

/**
 * Example demonstrating webhook operations:
 * - Confirm/register webhook URL
 * - Verify webhook data received from PayOS
 *
 * Note: You can view the history of webhook in https://my.payos.vn
 */

// Mock webhook data for demonstration
// In real usage, this would come from PayOS webhook POST request
const mockWebhookData: Webhook = {
  code: '00',
  desc: 'success',
  success: true,
  data: {
    orderCode: 123,
    amount: 3000,
    description: 'VQRIO123',
    accountNumber: '12345678',
    reference: 'TF230204212323',
    transactionDateTime: '2023-02-04 18:25:00',
    currency: 'VND',
    paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
    code: '00',
    desc: 'Thành công',
    counterAccountBankId: '',
    counterAccountBankName: '',
    counterAccountName: '',
    counterAccountNumber: '',
    virtualAccountName: '',
    virtualAccountNumber: '',
  },
  signature: '',
};

async function main() {
  const payos = new PayOS();
  // Calculate the webhook signature from mock data, this signature will be sent by payOS
  // You can using this method to manually verify the webhook data
  mockWebhookData.signature =
    (await payos.crypto.createSignatureFromObj(mockWebhookData.data, payos.checksumKey)) ?? '';

  try {
    // 1. Confirm/Register webhook URL
    console.log('Registering webhook URL...');
    const webhookUrl = 'https://your-domain.com/payos-webhook';

    const confirmResult = await payos.webhooks.confirm(webhookUrl);
    console.log('Webhook registered successfully:', confirmResult);
  } catch (error) {
    if (error instanceof WebhookError) {
      console.error('Webhook registration failed:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }

  try {
    // 2. Verify webhook data (simulate receiving webhook from PayOS)
    console.log('\nVerifying webhook data...');

    // In a real application, you would receive this data from PayOS
    const verifiedData = await payos.webhooks.verify(mockWebhookData);

    console.log('Webhook verified successfully:');
    console.log('Webhook data receive', verifiedData);

    // Process the payment confirmation
    console.log('Processing payment confirmation...');
    // Here you would update your database, send confirmation emails, etc.
  } catch (error) {
    if (error instanceof WebhookError) {
      console.error('Webhook verification failed:', error.message);
      console.log('This might be a fraudulent webhook request');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

main();
