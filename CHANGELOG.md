# Changelog

## 2.0.6 (2026-10-30)

### Bug Fixes

* **webhooks:** stricter validation of webhook data before signature verification ([GHSA-qrhp-2w9h-73m7](https://github.com/payOSHQ/payos-lib-node/security/advisories/GHSA-qrhp-2w9h-73m7))
* **client:** fail closed when a signed response is missing its signature ([GHSA-6gcq-x2cf-jqw5](https://github.com/payOSHQ/payos-lib-node/security/advisories/GHSA-6gcq-x2cf-jqw5))
* **crypto:** constant-time signature comparison; remove Math.random UUID fallback (runtimes without `crypto.getRandomValues` now throw when generating a UUID)
* **client:** encode identifiers interpolated into API paths and reject dot segments, empty values and unsafe integers; follow only 301/302/303/307/308 redirects, at most 5 and without retrying once exceeded, dropping `x-api-key`/`x-client-id`/`x-partner-code`/`authorization`/`cookie`/`proxy-authorization` headers for the rest of the chain once it leaves the API origin; validate body-signed response data before signature verification ([GHSA-pq6c-7q48-2r83](https://github.com/payOSHQ/payos-lib-node/security/advisories/GHSA-pq6c-7q48-2r83), [GHSA-x466-5gm5-93jf](https://github.com/payOSHQ/payos-lib-node/security/advisories/GHSA-x466-5gm5-93jf), [GHSA-qh59-g3pq-32g5](https://github.com/payOSHQ/payos-lib-node/security/advisories/GHSA-qh59-g3pq-32g5))

## 2.0.5 (2026-03-05)

### Bug Fixes

* **error:** fix incorrect error code mapping for Forbidden errors (403) in APIError.generateError

## 2.0.4 (2026-01-05)

### Bug Fixes

* **client:** add error handling for failed header signature creation

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
