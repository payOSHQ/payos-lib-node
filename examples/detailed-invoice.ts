import { APIError, CreatePaymentLinkRequest, PayOS } from '@payos/node';
import 'dotenv/config';

/**
 * Example demonstrating payment link creation with detailed item information
 * This shows how to create professional invoices with multiple items and tax calculations
 * The invoice only created if the payment gateway is connected to an invoice integration
 */
async function main() {
  const payos = new PayOS();
  const orderCode = Math.round(Date.now() / 1000);

  try {
    console.log('Creating payment link with detailed invoice...');
    const paymentData: CreatePaymentLinkRequest = {
      orderCode,
      amount: 126500, // Total amount including tax
      description: 'order' + orderCode,
      returnUrl: 'https://your-website.com/payment/success',
      cancelUrl: 'https://your-website.com/payment/cancel',

      // Buyer information
      buyerName: 'Nguyen Van A',
      buyerEmail: 'customer@example.com',
      buyerPhone: '012456789',
      buyerAddress: '123 Nguyen Trai, District 1, Ho Chi Minh City',
      buyerCompanyName: 'ABC Company Ltd.',
      buyerTaxCode: '0123456789-001',

      // Detailed items breakdown
      items: [
        {
          name: 'iPhone 15 Pro Case',
          quantity: 2,
          price: 25000,
          unit: 'piece',
          taxPercentage: 10,
        },
        {
          name: 'Screen Protector',
          quantity: 1,
          price: 15000,
          unit: 'piece',
          taxPercentage: 10,
        },
        {
          name: 'Wireless Charger',
          quantity: 1,
          price: 50000,
          unit: 'piece',
          taxPercentage: 10,
        },
      ],

      // Invoice configuration
      invoice: {
        buyerNotGetInvoice: false, // Customer wants invoice
        taxPercentage: 10, // Overall tax percentage
      },

      expiredAt: Math.round(Date.now() / 1000) + 60 * 60, // Expired in 1 hour
    };

    const paymentLink = await payos.paymentRequests.create(paymentData);

    console.log('Payment link created successfully!');
    console.log('');
    console.log('Payment Details:');
    console.log('   Order Code:', paymentLink.orderCode);
    console.log('   Payment Link ID:', paymentLink.paymentLinkId);
    console.log('   Total Amount:', paymentLink.amount.toLocaleString(), 'VND');
    console.log('');
    console.log('   Checkout URL:');
    console.log('   ', paymentLink.checkoutUrl);
    console.log('');
    console.log('   QR Code:');
    console.log('   ', paymentLink.qrCode);
    console.log('');
  } catch (error) {
    if (error instanceof APIError) {
      console.error('   Failed to create payment link:');
      console.error('   Status:', error.status);
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);

      // Handle specific error cases
      if (error.status === 400) {
        console.error('     Check your payment data format and required fields');
      } else if (error.status === 401) {
        console.error('     Verify your PayOS API credentials');
      }
    } else {
      console.error('   Unexpected error:', error);
    }
  }
}

main();
