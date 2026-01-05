import { createCryptoProvider, SubtleCryptoProvider, NodeCryptoProvider } from '../../src/crypto';
import { createCryptoProviderTestSuite } from './helper';

describe('NodeCryptoProvider', () => {
  const node = createCryptoProvider('node');
  createCryptoProviderTestSuite(node);

  describe('edge cases and utils', () => {
    it('createSignatureFromObj returns null when no data or key provided', async () => {
      expect(await node.createSignatureFromObj({}, '')).toBeNull();
      expect(await node.createSignatureFromObj(null as any, 'test')).toBeNull();
    });

    it('createSignatureOfPaymentRequest returns null when no data or key provided', async () => {
      expect(await node.createSignatureOfPaymentRequest({} as any, '')).toBeNull();
      expect(await node.createSignatureOfPaymentRequest(null as any, 'test')).toBeNull();
    });

    it('createUuidv4 returns a valid UUID and produces unique values', () => {
      const a = node.createUuidv4();
      const b = node.createUuidv4();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidV4Regex.test(a)).toBe(true);
      expect(uuidV4Regex.test(b)).toBe(true);
      expect(a).not.toBe(b);
    });
  });
});

describe('SubtleCryptoProvider', () => {
  const subtle = createCryptoProvider('browser');
  createCryptoProviderTestSuite(subtle);

  describe('edge cases and utils', () => {
    it('createSignatureFromObj returns null when no data or key provided', async () => {
      expect(await subtle.createSignatureFromObj({}, '')).toBeNull();
      expect(await subtle.createSignatureFromObj(null as any, 'test')).toBeNull();
    });

    it('createSignatureOfPaymentRequest returns null when no data or key provided', async () => {
      expect(await subtle.createSignatureOfPaymentRequest({} as any, '')).toBeNull();
      expect(await subtle.createSignatureOfPaymentRequest(null as any, 'test')).toBeNull();
    });

    it('createUuidv4 returns a valid UUID and falls back when crypto.randomUUID is not present', () => {
      const original = (global as any).crypto;

      try {
        // if randomUUID exists, test the behavior when present
        (global as any).crypto = { randomUUID: () => '00000000-0000-4000-8000-000000000000' };
        const withBuiltin = subtle.createUuidv4();
        expect(withBuiltin).toBe('00000000-0000-4000-8000-000000000000');

        // remove crypto.randomUUID to test fallback implementation
        (global as any).crypto = undefined;
        const fallback = subtle.createUuidv4();
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuidV4Regex.test(fallback)).toBe(true);
      } finally {
        (global as any).crypto = original;
      }
    });
  });
});

describe('createCryptoProvider factory auto-detection', () => {
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    originalWindow = (global as any).window;
    originalNavigator = (global as any).navigator;
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    (global as any).navigator = originalNavigator;
  });

  it('returns SubtleCryptoProvider when running in a browser-like environment', () => {
    (global as any).window = {};
    (global as any).window.document = {};
    (global as any).navigator = {};

    const provider = createCryptoProvider();
    expect(provider).toBeInstanceOf(SubtleCryptoProvider);
  });

  it('returns NodeCryptoProvider when environment does not look like a browser', () => {
    delete (global as any).window;
    delete (global as any).navigator;

    const provider = createCryptoProvider();
    expect(provider).toBeInstanceOf(NodeCryptoProvider);
  });
});
