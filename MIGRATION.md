# Migration guide

This guide outlines the changes and steps needed to migrate your codebase to the latest version of the payOS Typescript and Javascript SDK.

## Breaking changes

### Initialize client

The library now relies on the [builtin Web fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) instead of `axios`. So we change the initialize function to have better options for the client.

```ts
// before
import PayOS from '@payos/node';

const payos = new PayOS(clientId, apiKey, checksumKey, partnerCode);

// after
import { PayOS } from '@payos/node';

const payos = new PayOS({ clientId, apiKey, checksumKey, partnerCode });
```

### Methods name

All methods related to payment request now under `PayOS.paymentRequests`.

```ts
// before
await payos.createPaymentLink(paymentData);
await payos.getPaymentLinkInformation(paymentLinkId);
await payos.cancelPaymentLink(paymentLinkId);

// after
await payos.paymentRequests.create(paymentData);
await payos.paymentRequests.get(paymentLinkId);
await payos.paymentRequests.cancel(paymentLinkId);
```

For webhook related methods, they now under `PayOS.webhooks`.

```ts
// before
await payos.confirmWebhook(webhookUrl);
payos.verifyPaymentWebhookData(webhookBody);

// after
await payos.webhooks.confirm(webhookUrl);
await payos.webhooks.verify(webhookBody);
```

### Types

Some types has been renamed, more detail below.

```ts
// before
const paymentData: CheckoutRequestType;
const result: CheckoutResponseDataType = await payos.createPaymentLink(paymentData);

// after
const paymentData: CreatePaymentLinkRequest;
const result: CreatePaymentLinkResponse = await payos.paymentRequests.create(paymentData);
```

```ts
// before
const paymentLinkInfo: PaymentLinkDataType = await payos.getPaymentLinkInformation(paymentLinkId);
const paymentLinkCancelled: PaymentLinkDataType = await payos.cancelPaymentLink(paymentLinkId);

// after
const paymentLinkInfo: PaymentLink = await payos.paymentRequests.get(paymentLinkId);
const paymentLinkCancelled: PaymentLink = await payos.paymentRequests.cancel(paymentLinkId);
```

```ts
// before
const confirmResult: string = await payos.confirmWebhook(webhookUrl);
const webhookBody: WebhookType;
const webhookDataVerified: WebhookDataType = payos.verifyPaymentWebhookData(webhookBody);

// after
const confirmResult: ConfirmWebhookResponse = await payos.webhooks.confirm(webhookUrl);
const webhookBody: Webhook;
const webhookDataVerified: WebhookData = await payos.webhooks.verify(webhookBody);
```

### Handling errors

The library now throw client error as `PayOS.PayOSError`, API related errors as `PayOS.APIError`, webhook related errors as `PayOS.WebhookError` and signature related errors as `PayOS.SignatureError` instead of throw `PayOSError` for related API errors and `Error` for other errors.

```ts
// before
payos
  .createPaymentLink(paymentData)
  .then((res) => res)
  .catch((err) => {
    if (err instanceof PayOSError) {
      console.log(err.message);
      console.log(err.code);
    }
  });

// after
payos.paymentRequests
  .create(paymentData)
  .then((res) => res)
  .catch((err) => {
    if (err instanceof APIError) {
      console.log(err.status);
      console.log(err.code);
      console.log(err.desc);
    }
  });
```
