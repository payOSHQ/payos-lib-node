import { APIError, PayOS } from '@payos/node';
import 'dotenv/config';

/**
 * Example demonstrating payment link management operations:
 * - Retrieve payment info
 * - Cancel payment
 */
async function main() {
  const payos = new PayOS();
  const orderCode = Math.round(Date.now() / 1000);

  try {
    // First, create a payment link
    console.log('Creating payment link...');
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: 25000,
      description: 'demo',
      returnUrl: 'https://your-website.com/success',
      cancelUrl: 'https://your-website.com/cancel',
    });

    console.log('Payment created with ID:', paymentLink.paymentLinkId);

    // Retrieve payment information using order code
    console.log('\nRetrieving payment info by order code...');
    const retrievedPayment = await payos.paymentRequests.get(orderCode);
    console.log('Status:', retrievedPayment.status);
    console.log('Amount:', retrievedPayment.amount);
    console.log('Amount Paid:', retrievedPayment.amountPaid);
    console.log('Created At:', retrievedPayment.createdAt);

    // Cancel the payment
    console.log('\nCancelling payment...');
    const cancelledPayment = await payos.paymentRequests.cancel(orderCode, 'Demo cancellation');

    console.log('Payment cancelled successfully');
    console.log('New status:', cancelledPayment.status);
  } catch (error) {
    if (error instanceof APIError) {
      console.error('API Error:', error.message);
      if (error.status === 404) {
        console.error('Payment not found');
      } else if (error.status === 400) {
        console.error('Invalid request data');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

main();
