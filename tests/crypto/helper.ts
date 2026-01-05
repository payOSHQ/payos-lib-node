import { CryptoProvider } from '../../src/crypto';
import testCases from './testCases.json';

const CHECKSUM_KEY = 'test_checksum_key';

export const createCryptoProviderTestSuite = (cryptoProvider: CryptoProvider) => {
  describe('createSignatureFromObj', () => {
    const bodyTestCases = testCases.filter((item) => item.type === 'body');
    for (const testCase of bodyTestCases) {
      it(testCase.caseName, async () => {
        expect(await cryptoProvider.createSignatureFromObj(testCase.payload, CHECKSUM_KEY)).toEqual(
          testCase.expect,
        );
      });
    }
  });

  describe('createSignatureOfPaymentRequest', () => {
    const createPaymentLinkTestCases = testCases.filter((item) => item.type === 'create-payment-link');
    for (const testCase of createPaymentLinkTestCases) {
      it(testCase.caseName, async () => {
        expect(await cryptoProvider.createSignatureOfPaymentRequest(testCase.payload, CHECKSUM_KEY)).toEqual(
          testCase.expect,
        );
      });
    }
  });

  describe('createSignature', () => {
    const headerTestCases = testCases.filter((item) => item.type === 'header');
    for (const testCase of headerTestCases) {
      it(testCase.caseName, async () => {
        expect(await cryptoProvider.createSignature(CHECKSUM_KEY, testCase.payload)).toEqual(testCase.expect);
      });
    }
  });
};
