import { WebhookError } from '../../core/error';
import type { WebhookData } from './webhook';

// Find-any-bad-char: `^...$` would let a trailing `\n` through.
const INVALID_KEY_CHAR = /[^A-Za-z0-9_]/;
const CORE_INT = ['orderCode', 'amount'];
const CORE_STR = [
  'description',
  'accountNumber',
  'reference',
  'transactionDateTime',
  'currency',
  'paymentLinkId',
  'code',
  'desc',
];
const OPTIONAL_STR = [
  'counterAccountBankId',
  'counterAccountBankName',
  'counterAccountName',
  'counterAccountNumber',
  'virtualAccountName',
  'virtualAccountNumber',
];

const fail = (reason: string): never => {
  throw new WebhookError(`Invalid webhook data: ${reason}`);
};

export function validateWebhookData(data: unknown): asserts data is WebhookData {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    fail('data must be an object');
  }
  const record = data as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (key.length === 0 || key === '__proto__' || INVALID_KEY_CHAR.test(key)) {
      fail(`invalid key ${JSON.stringify(key)}`);
    }
    if (typeof value === 'string' && value.includes('=')) {
      fail(`${key} contains '='`);
    }
    if (
      value !== null &&
      typeof value !== 'string' &&
      !(typeof value === 'number' && Number.isSafeInteger(value))
    ) {
      fail(`${key} has unsupported type`);
    }
  }

  for (const key of CORE_INT) {
    if (!Number.isSafeInteger(record[key])) {
      fail(`${key} must be an integer`);
    }
  }
  for (const key of CORE_STR) {
    if (typeof record[key] !== 'string') {
      fail(`${key} must be a string`);
    }
  }
  for (const key of OPTIONAL_STR) {
    if (key in record && record[key] !== null && typeof record[key] !== 'string') {
      fail(`${key} must be a string or null`);
    }
  }
}
