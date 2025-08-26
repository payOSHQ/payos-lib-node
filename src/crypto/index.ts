import { isRunningInBrowser } from '../utils/detect-platform';
import { NodeCryptoProvider } from './node-crypto';
import { CryptoProvider } from './provider';
import { SubtleCryptoProvider } from './subtle-crypto';

/**
 * Creates an appropriate crypto provider based on the runtime environment
 * @param forceProvider - Force a specific provider type, otherwise auto-detect
 * @returns CryptoProvider instance for the current or specified environment
 */
export function createCryptoProvider(forceProvider?: 'node' | 'browser'): CryptoProvider {
  if (forceProvider === 'node') {
    return new NodeCryptoProvider();
  } else if (forceProvider === 'browser') {
    return new SubtleCryptoProvider();
  } else {
    return isRunningInBrowser() ? new SubtleCryptoProvider() : new NodeCryptoProvider();
  }
}

export { CryptoProvider } from './provider';
export { NodeCryptoProvider } from './node-crypto';
export { SubtleCryptoProvider } from './subtle-crypto';
