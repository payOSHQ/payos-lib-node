import { APIError, PayOS, PayoutBatchRequest } from '@payos/node';
import 'dotenv/config';

/**
 * Example demonstrating payout operations.
 * Note: Payout credentials are different from payment request credentials.
 */
async function main() {
  const payos = new PayOS({
    clientId: process.env.PAYOS_PAYOUT_CLIENT_ID,
    apiKey: process.env.PAYOS_PAYOUT_API_KEY,
    checksumKey: process.env.PAYOS_PAYOUT_CHECKSUM_KEY,
  });

  try {
    console.log('Creating a batch payout...');
    const referenceId = `payout_${Date.now()}`;
    const payoutBatchRequest: PayoutBatchRequest = {
      referenceId,
      category: ['salary'],
      validateDestination: true,
      payouts: [
        {
          referenceId: '',
          amount: 2000,
          description: 'batch payout',
          toBin: '970422',
          toAccountNumber: '0123456789',
        },
        {
          referenceId: '',
          amount: 2000,
          description: 'batch payout',
          toBin: '970422',
          toAccountNumber: '0123456789',
        },
        {
          referenceId: '',
          amount: 2000,
          description: 'batch payout',
          toBin: '970422',
          toAccountNumber: '0123456789',
        },
      ],
    };
    payoutBatchRequest.payouts.map((payout, index) => ({
      ...payout,
      referenceId: `${referenceId}_${index}`,
    }));
    const payoutBatch = await payos.payouts.batch.create(payoutBatchRequest);
    console.log('Payout detail:\n', payoutBatch);
    console.log('Fetching recent payouts...');
    const payoutsList = await payos.payouts.list({
      limit: 5,
    });

    console.log('Payouts retrieved:');
    const payouts = await payoutsList.toArray();

    if (payouts.length === 0) {
      console.log('No payouts found');
    } else {
      console.log('Payouts retrieve:\n', payouts);
    }

    console.log('\nFetching payout account balance...');
    const accountInfo = await payos.payoutsAccount.balance();

    console.log('Account Information:', accountInfo);
  } catch (error) {
    if (error instanceof APIError) {
      console.error('API Error:', error.message);
      console.error('Status Code:', error.status);
      console.error('Error Code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

main();
