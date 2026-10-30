import { PayOSError } from '../core/error';

/**
 * Turns an identifier into a single, safe URL path segment.
 *
 * Identifiers are interpolated into API paths such as `/v2/payment-requests/{id}/cancel`. Without
 * encoding, a value like `../../v1/payouts-account/balance` or `x?` re-targets the authenticated
 * request to another endpoint, so strings are percent-encoded and `.`/`..` segments are rejected.
 * Numbers must be safe integers.
 *
 * @param name - Parameter name, used in error messages.
 * @param value - The identifier (payment link ID, order code, invoice ID, payout ID...).
 * @returns The value as a percent-encoded path segment.
 * @throws {PayOSError} When the value is empty, a dot segment, or not a safe integer.
 */
export const encodePathSegment = function (name: string, value: unknown): string {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new PayOSError(`${name} must be a non-negative safe integer`);
    }
    return String(value);
  }
  if (typeof value !== 'string' || value.length === 0) {
    throw new PayOSError(`${name} must be a non-empty string or a safe integer`);
  }
  if (value === '.' || value === '..') {
    throw new PayOSError(`${name} must not be a dot segment`);
  }
  return encodeURIComponent(value);
};
