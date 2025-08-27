# payOS Node.js Library

[![Version](https://img.shields.io/npm/v/@payos/node.svg)](https://www.npmjs.org/package/@payos/node)
[![Downloads](https://img.shields.io/npm/dm/@payos/node.svg)](https://www.npmjs.com/package/@payos/node)

The payOS Node library provides convenient access to the payOS Merchant API from applications written in JavaScript or Typescript.

To learn how to use payOS Merchant API, checkout our [API Reference](https://payos.vn/docs/api) and [Documentation](https://payos.vn/docs). We also have some examples in [Examples](./examples/).

## Requirements

Node 20 or higher.

## Installation

```bash
npm install @payos/node
```

> [!IMPORTANT]
> If update from v1, check [Migration guide](./MIGRATION.md) for detail migration.

## Usage

### Basic usage

First you need initialize the client to interacting with payOS Merchant API.

```ts
import { PayOS } from '@payos/node';
// or
const { PayOS } = require('@payos/node');

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  // ... other options
});
```

Then you can interact with payOS Merchant API, example create a payment link using `paymentRequests.create()`.

```ts
const paymentLink = await payos.paymentRequests.create({
  orderCode: 123,
  amount: 2000,
  description: 'payment',
  returnUrl: 'https://your-url.com',
  cancelUrl: 'https://your-url.com',
});
```

### Webhook verification

You can register an endpoint to receive the payment webhook.

```ts
const confirmResult = await payos.webhooks.confirm('https://your-url.com/payos-webhook');
```

Then using `webhooks.verify()` to verify and receive webhook data.

```ts
const webhookData = await payos.webhooks.verify({
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
  signature: '8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f',
});
```

For more information about webhooks, see [the API doc](https://payos.vn/docs/api/#tag/payment-webhook/operation/payment-webhook).

### Handling errors

When the API return a non-success status code (i.e, 4xx or 5xx response) or non-success code data (any code except '00'), a class `APIError` or its subclass will be thrown:

```ts
payos
  .get({
    path: '/not-found',
  })
  .catch((err) => {
    if (err instanceof APIError) {
      console.log(err.name); // NotFoundError
      console.log(err.message); // HTTP 404, {}
      console.log(err.status); // 404
      console.log(err.headers); // {server: "nginx",...}
      console.log(err.code); // undefined
      console.log(err.desc); // undefined
    } else {
      throw err;
    }
  });
```

### Auto pagination

List method in the payOS Merchant API are paginated, You can use the `for await ... of` syntax to iterate though items across all pages:

```ts
const allPayouts = [];
const payoutPage = await payos.payouts.list({ limit: 3 });
for await (const payout of payoutPage) {
  allPayouts.push(payout);
}
console.log(allPayouts);
// or
const payouts = await payoutPage.toArray();
console.log(payouts);
```

Or you can request single page at a time:

```ts
let page = await payos.payouts.list({
  limit: 3,
});
for (const payout of page.data) {
  console.log(payout);
}

while (page.hasNextPage()) {
  page = await page.getNextPage();
}
```

### Advanced usage

#### Custom configuration

You can customize the PayOS client with various options:

```ts
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  partnerCode: process.env.PAYOS_PARTNER_CODE, // Optional partner code
  baseURL: 'https://api-merchant.payos.vn', // Custom base URL
  timeout: 30000, // Request timeout in milliseconds (default: 60000)
  maxRetries: 3, // Maximum retry attempts (default: 2)
  logLevel: 'info', // Log level: 'off', 'error', 'warn', 'info', 'debug'
  logger: console, // Custom logger implementation
  fetchOptions: {
    // Additional fetch options
    headers: {
      'Custom-Header': 'value',
    },
  },
});
```

#### Custom fetch implementation

You can provide a custom fetch implementation:

```ts
import fetch from 'node-fetch'; // or any other fetch implementation

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  fetch: fetch as any, // Custom fetch function
});
```

#### Request-level options

You can override client-level settings for individual requests:

```ts
const paymentLink = await payos.paymentRequests.create(
  {
    orderCode: 123,
    amount: 2000,
    description: 'payment',
    returnUrl: 'https://your-url.com',
    cancelUrl: 'https://your-url.com',
  },
  {
    maxRetries: 5, // Override default max retries
    timeout: 10000, // Override default timeout
    signal: abortController.signal, // AbortSignal for request cancellation
  },
);
```

#### Logging and debugging

The log level can be configured in two ways:

1. Via the `PAYOS_LOG` environment variable.
2. Using the `logLevel` client option (override the environment if set).

By default, this library logs to `globalThis.console`. You can also provide a custom logger. If your logger doesn't work, please open an issue.

```ts
import { createLogger } from 'winston';

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  logLevel: 'debug', // Enable debug logging
  logger: createLogger({
    level: 'debug',
    transports: [new transports.Console()],
  }),
});
```

#### Direct API access

For advanced use cases, you can make direct API calls:

```ts
// GET request
const response = await payos.get('/v2/payment-requests');

// POST request
const response = await payos.post('/v2/payment-requests', {
  body: {
    orderCode: 123,
    amount: 2000,
    description: 'payment',
    returnUrl: 'https://your-url.com',
    cancelUrl: 'https://your-url.com',
  },
});

// With custom options
const response = await payos.request({
  method: 'POST',
  path: '/v2/payment-requests',
  body: requestData,
  maxRetries: 3,
  timeout: 15000,
});
```

#### Signature

The signature can be manually created by `PayOS.crypto`:

```ts
// for create-payment-link signature
const signature = await payos.crypto.createSignatureOfPaymentRequest(data, payos.checksumKey);
// of
const signature = await payos.crypto.createSignatureFromObj(
  { amount, cancelUrl, description, orderCode, returnUrl },
  payos.checksumKey,
);

// for payment-requests and webhook signature
const signature = await payos.crypto.createSignatureFromObj(data, payos.checksumKey);

// for payouts signature
const signature = await payos.crypto.createSignature(payos.checksumKey, data);
```

### Contributing

See [the contributing documentation](./CONTRIBUTING.md).
