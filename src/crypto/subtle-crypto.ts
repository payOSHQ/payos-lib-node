import { DataType } from '../core/api-response';
import convertObjToQueryStr from '../utils/convert-obj-to-query-str';
import { deepSortObj, sortObjDataByKey } from '../utils/sort-obj-by-key';
import { CryptoProvider, SignatureOptions } from './provider';

/**
 * Browser crypto implementation using SubtleCrypto API
 */
export class SubtleCryptoProvider implements CryptoProvider {
  /**
   * Create HMAC signature using SubtleCrypto API
   */
  private async createHmac(algorithm: string, key: string, data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algorithm.toUpperCase() },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

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
    try {
      const sortedDataByKey = sortObjDataByKey(data);
      const dataQueryStr = convertObjToQueryStr(sortedDataByKey);
      const dataToSignature = await this.createHmac('sha-256', key, dataQueryStr);
      return dataToSignature;
    } catch (error) {
      console.error('Error creating signature from object:', error);
      return null;
    }
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
    try {
      const { amount, cancelUrl, description, orderCode, returnUrl } = data;
      const dataStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
      const dataToSignature = await this.createHmac('sha-256', key, dataStr);
      return dataToSignature;
    } catch (error) {
      console.error('Error creating payment signature:', error);
      return null;
    }
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

    const hmac = await this.createHmac(`sha-${algorithm.replace('sha', '')}`, secretKey, queryString);
    return hmac;
  }

  /**
   * Generate a random UUIDv4 string using crypto.randomUUID or fallback implementation
   */
  createUuidv4(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // https://stackoverflow.com/a/2117523
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
