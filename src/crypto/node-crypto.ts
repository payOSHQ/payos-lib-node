import { createHmac, randomUUID } from 'crypto';
import { CryptoProvider, SignatureOptions } from './provider';
import { deepSortObj, sortObjDataByKey } from '../utils/sort-obj-by-key';
import { DataType } from '../core/api-response';
import convertObjToQueryStr from '../utils/convert-obj-to-query-str';

/**
 * Node.js crypto implementation using the built-in crypto module
 */
export class NodeCryptoProvider implements CryptoProvider {
  /**
   * Generates a SHA-256 HMAC signature from an object by:
   * - Sorting the object's keys
   * - Converting the sorted object to a query string
   * - Creating a HMAC signature using the provided key
   */
  async createSignatureFromObj(data: object, key: string): Promise<string | null> {
    if (!data || !key.length) {
      return null;
    }
    const sortedDataByKey = sortObjDataByKey(data);
    const dataQueryStr = convertObjToQueryStr(sortedDataByKey);
    const dataToSignature = createHmac('sha256', key).update(dataQueryStr).digest('hex');
    return dataToSignature;
  }

  /**
   * Generates a SHA-256 HMAC signature for a payment request using specific fields:
   * - amount, cancelUrl, description, orderCode, returnUrl
   * - Concatenates these fields into a query string and signs it with the provided key
   */
  async createSignatureOfPaymentRequest(data: DataType<any>, key: string): Promise<string | null> {
    if (!data || !key.length) {
      return null;
    }
    const { amount, cancelUrl, description, orderCode, returnUrl } = data;
    const dataStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    const dataToSignature = createHmac('sha256', key).update(dataStr).digest('hex');
    return dataToSignature;
  }

  /**
   * Create HMAC signature from JSON data with query string format
   */
  async createSignature(
    secretKey: string,
    jsonData: object,
    options: SignatureOptions = {},
  ): Promise<string> {
    const { encodeUri = true, sortArrays = false, algorithm = 'sha256' } = options;

    const sortedData: Record<string, any> = deepSortObj(jsonData, sortArrays);

    const queryString = Object.keys(sortedData)
      .map((key) => {
        let value = sortedData[key];

        // Handle arrays by JSON stringify them
        if (Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        // Handle nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }

        // Conditionally URL encode the key and value based on options
        if (encodeUri) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        }
        return `${key}=${value}`;
      })
      .join('&');

    const hmac = createHmac(algorithm, secretKey).update(queryString).digest('hex');
    return hmac;
  }

  /**
   * Generate a random UUIDv4 string using Node.js crypto.randomUUID
   */
  createUuidv4(): string {
    return randomUUID();
  }
}
