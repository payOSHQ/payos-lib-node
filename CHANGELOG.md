# Changelog

## 2.0.3 (2025-09-11)

### Features

* **client:** add orderCode and paymentLinkId as params for method `PayOS.paymentRequests.invoices.get` and `PayOS.paymentRequests.invoices.download`

### Bug fixes

* **client:** correct version of SDK in user-agent info

## 2.0.2 (2025-08-29)

### Bug fixes

* **client:** renamed fields of invoices endpoint

## 2.0.1 (2025-08-27)

### Bug fixes

* **client:** export type for payout batch and payment request invoice

## 2.0.0 (2025-08-27)

This release migrate from `axios` to builtin `fetch`, change method name, change type name, and add payout related methods. For full migrate guild see [MIGRATION.md](./MIGRATION.md).

### Features

* **api:** add `/v2/payment-request/invoices`
* **api:** add `/v1/payouts`
* **api:** add `/v1/payouts-account`
* **client:** add default value for credential read from environment variable
* **client:** add `PayOS.crypto` to calculate signature for payment-requests and payouts signature
* **client:** add additional options to all method
* **client:** add logging with custom logger
* **client:** add pagination support for get list request
* **client:** add retry for rate limit request
* **client:** add Error subclass to handle api error, webhook error and signature error for better error handling
* **client:** add support for request download file

### Documentation

* **readme:** update readme
