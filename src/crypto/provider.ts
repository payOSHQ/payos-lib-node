/**
 * Interface for crypto operations that can be implemented for different environments
 */
export interface CryptoProvider {
  /**
   * Create HMAC signature from object data
   * @param data - The data object to sign
   * @param key - The secret key for HMAC generation
   * @returns Promise<string | null> - The signature or null if failed
   */
  createSignatureFromObj(data: object, key: string): Promise<string | null>;

  /**
   * Create HMAC signature for payment request
   * @param data - The payment request data
   * @param key - The secret key for HMAC generation
   * @returns Promise<string | null> - The signature or null if failed
   */
  createSignatureOfPaymentRequest(data: any, key: string): Promise<string | null>;

  /**
   * Create HMAC signature from JSON data
   * @param secretKey - Secret key for HMAC signature generation
   * @param jsonData - JSON object data to be signed
   * @param options - Configuration options for signature generation
   * @returns Promise<string> - HMAC signature in hexadecimal format
   */
  createSignature(secretKey: string, jsonData: object, options?: SignatureOptions): Promise<string>;

  /**
   * Generate a random UUIDv4 string
   * @returns string - A randomly generated UUIDv4 string
   */
  createUuidv4(): string;
}

export type SignatureOptions = {
  encodeUri?: boolean;
  sortArrays?: boolean;
  algorithm?: 'sha256' | 'sha1' | 'sha512' | 'md5';
};
