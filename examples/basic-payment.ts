import { APIError, PayOS } from '@payos/node';
import 'dotenv/config';

/**
 * Simple example demonstrating basic payment link creation
 * This is the most common use case for PayOS integration
 */
async function main() {
  const payos = new PayOS();

  // Generate a unique order code
  const orderCode = Math.round(Date.now() / 1000);

  try {
    // Create a simple payment link
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: 50000, // 50,000 VND
      description: 'Simple payment example',
      returnUrl: 'https://your-website.com/success',
      cancelUrl: 'https://your-website.com/cancel',
    });

    console.log('Payment link created successfully:');
    console.log('Checkout URL:', paymentLink.checkoutUrl);
    console.log('Payment Link ID:', paymentLink.paymentLinkId);
    console.log('Order Code:', paymentLink.orderCode);
  } catch (error) {
    if (error instanceof APIError) {
      console.error('API Error:', error.message);
      console.error('Status:', error.status);
      console.error('Code:', error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

main();
