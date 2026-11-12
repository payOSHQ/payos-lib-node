import { PayOS, WebhookError } from '../../../src';

type VectorCase = { id: string; expect: 'accept' | 'reject'; body: string };

const vectors: { checksumKey: string; cases: VectorCase[] } = require('../../fixtures/webhook-vectors.json');

// R14/R15 are signature-mismatch cases; every other reject must be caught by the validator.
const SIGNATURE_ONLY_REJECTS = ['R14', 'R15'];

describe('Webhooks.verify shared vectors', () => {
  const payos = new PayOS({ clientId: 'c', apiKey: 'a', checksumKey: vectors.checksumKey });

  it.each(vectors.cases.map((c) => [c.id, c] as const))('%s', async (_id, c) => {
    const body = JSON.parse(c.body);
    if (c.expect === 'accept') {
      await expect(payos.webhooks.verify(JSON.parse(c.body))).resolves.toMatchObject({
        orderCode: body.data.orderCode,
      });
      return;
    }
    const promise = payos.webhooks.verify(JSON.parse(c.body));
    await expect(promise).rejects.toBeInstanceOf(WebhookError);
    if (!SIGNATURE_ONLY_REJECTS.some((prefix) => c.id.startsWith(prefix))) {
      await expect(promise).rejects.toThrow(/^Invalid webhook data/);
    }
  });
});
