import { APIError, PayOSError, PayOS } from '@payos/node';
import 'dotenv/config';

/**
 * Comprehensive example demonstrating various error handling patterns
 * in PayOS Node.js SDK
 */
async function main() {
  const payos = new PayOS();

  console.log('Testing various error scenarios...\n');

  // 1. Invalid payment data (validation error)
  await testValidationError(payos);

  // 2. Authentication error
  await testAuthenticationError();

  // 3. Resource not found error
  await testNotFoundError(payos);

  // 4. Network timeout error
  await testTimeoutError(payos);

  // 5. Rate limiting error
  await testRateLimitError(payos);

  console.log('\nError handling demonstration completed!');
}

async function testValidationError(payos: PayOS) {
  console.log('Testing validation error...');
  try {
    await payos.paymentRequests.create({
      orderCode: 0, // Invalid: order code must be positive
      amount: -100, // Invalid: amount must be positive
      description: '', // Invalid: description cannot be empty
      returnUrl: 'invalid-url', // Invalid: not a proper URL
      cancelUrl: 'invalid-url', // Invalid: not a proper URL
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.log('Validation Error Caught:');
      console.log('   Status:', error.status);
      console.log('   Message:', error.desc);
      console.log('   Code:', error.code);
    }
  }
  console.log('');
}

async function testAuthenticationError() {
  console.log('Testing authentication error...');
  try {
    // Create PayOS instance with invalid credentials
    const invalidPayos = new PayOS({
      clientId: 'invalid-client-id',
      apiKey: 'invalid-api-key',
      checksumKey: 'invalid-checksum-key',
    });

    await invalidPayos.paymentRequests.create({
      orderCode: Math.round(Date.now() / 1000),
      amount: 50000,
      description: 'Test payment',
      returnUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.log('Authentication Error Caught:');
      console.log('   Status:', error.status);
      console.log('   Message:', error.desc);
      console.log('   Code:', error.code);

      if (error.status === 401) {
        console.log('   Fix: Check your API credentials in .env file');
      }
    }
  }
  console.log('');
}

async function testNotFoundError(payos: PayOS) {
  console.log('Testing not found error...');
  try {
    // Try to get a payment that doesn't exist
    await payos.paymentRequests.get('non-existent-payment-id');
  } catch (error) {
    if (error instanceof APIError) {
      console.log('Not Found Error Caught:');
      console.log('   Status:', error.status);
      console.log('   Message:', error.desc);
      console.log('   Code:', error.code);

      if (error.status === 404) {
        console.log('  The requested payment link does not exist');
      }
    }
  }
  console.log('');
}

async function testTimeoutError(payos: PayOS) {
  console.log('Testing timeout error...');
  try {
    // Set a very short timeout to force a timeout error
    await payos.paymentRequests.create(
      {
        orderCode: Math.round(Date.now() / 1000),
        amount: 50000,
        description: 'Timeout test payment',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      },
      {
        timeout: 1, // 1ms timeout - will definitely timeout
      },
    );
  } catch (error) {
    if (error instanceof PayOSError) {
      console.log('Timeout Error Caught:');
      console.log('   Type:', error.constructor.name);
      console.log('   Message:', error.message);
    }
  }
  console.log('');
}

async function testRateLimitError(payos: PayOS) {
  console.log('Testing rate limit handling...');
  console.log('   (Making multiple rapid requests)');

  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(
      payos.paymentRequests
        .create({
          orderCode: Math.round(Date.now() / 1000) + i,
          amount: 1000,
          description: `Rate limit test ${i + 1}`,
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
        .catch((error) => {
          if (error instanceof APIError && error.status === 429) {
            console.log('   Rate Limit Error Caught:');
            console.log('   Status:', error.status);
            console.log('   Message:', error.desc);
            return null;
          }
          throw error;
        }),
    );
  }

  try {
    await Promise.allSettled(requests);
    console.log('All requests completed (some may have been rate limited)');
  } catch (error) {
    console.log('Unexpected error during rate limit test:', error);
  }
  console.log('');
}

main().catch((error) => {
  console.error('Unhandled error in main function:', error);
});
