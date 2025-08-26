import { APIError, PayOS } from '@payos/node';
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
    console.log('Fetching recent payouts...');
    const payoutsList = await payos.payouts.list({
      limit: 5,
    });

    console.log('Payouts retrieved:');
    const payouts = await payoutsList.toArray();

    if (payouts.length === 0) {
      console.log('No payouts found');
    } else {
      payouts.forEach((payout, index) => {
        console.log(`${index + 1}. Payout ID: ${payout.id}`);
        console.log(`   Reference ID: ${payout.referenceId}`);
        console.log(`   Approval State: ${payout.approvalState}`);
        console.log(`   Created: ${payout.createdAt}`);
        console.log(`   Transactions: ${payout.transactions.length} item(s)`);
        console.log('---');
      });
    }

    console.log('\nFetching payout account balance...');
    const accountInfo = await payos.payoutsAccount.balance();

    console.log('Account Information:');
    console.log('Account Number:', accountInfo.accountNumber);
    console.log('Account Name:', accountInfo.accountName);
    console.log('Currency:', accountInfo.currency);
    console.log('Balance:', parseFloat(accountInfo.balance).toLocaleString(), accountInfo.currency);
  } catch (error) {
    if (error instanceof APIError) {
      console.error('API Error:', error.message);

      if (error.status === 401) {
        console.error('Authentication failed. Check your API credentials.');
      } else if (error.status === 403) {
        console.error('Access denied. Payout features may not be enabled for your account.');
      } else if (error.status === 404) {
        console.error('Resource not found.');
      }

      console.error('Status Code:', error.status);
      console.error('Error Code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

main();
