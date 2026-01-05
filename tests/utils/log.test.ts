import { loggerFor, parseLogLevel, formatRequestDetail } from '../../src/utils/log';
import { PayOS } from '../../src';

describe('Log Utils', () => {
  it('loggerFor returns noop logger when client has no logger', () => {
    const client = new PayOS({ clientId: 'c', apiKey: 'k', checksumKey: 's' });
    client.logger = undefined as any;
    const l = loggerFor(client);
    expect(typeof l.error).toBe('function');
    expect(typeof l.warn).toBe('function');
    expect(typeof l.info).toBe('function');
    expect(typeof l.debug).toBe('function');
  });

  it('parseLogLevel returns undefined and warns on invalid level', () => {
    const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
    const client = new PayOS({ clientId: 'c', apiKey: 'k', checksumKey: 's', logger, logLevel: 'debug' as any });
    const res = parseLogLevel('nope', 'source', client);
    expect(res).toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('formatRequestDetail sanitizes sensitive headers', () => {
    const res = formatRequestDetail({ headers: { Authorization: 'token', 'x-api-key': 'key', 'Content-Type': 'application/json' } as any });
    expect((res as any).headers.Authorization).toBe('***');
    expect((res as any).headers['x-api-key']).toBe('***');
    expect((res as any).headers['Content-Type']).toBe('application/json');
  });
});
