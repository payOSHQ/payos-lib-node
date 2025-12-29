import { GenericPage } from '../../src/core/pagination';
import { PayOS } from '../../src';

describe('Pagination', () => {
  const BASE_OPTS = { method: 'GET', path: '/v1/test' } as any;

  it('constructs empty page when no data', () => {
    const client = new PayOS({ clientId: 'c', apiKey: 'k', checksumKey: 's' });
    const page = new GenericPage<string>(client, null, BASE_OPTS);
    expect(page.data).toEqual([]);
    expect(page.pagination.count).toBe(0);
  });

  it('hasNextPage/hasPreviousPage logic and getNextPage calls client.request', async () => {
    const client = new PayOS({ clientId: 'c', apiKey: 'k', checksumKey: 's' });
    const data = {
      items: ['a', 'b'],
      pagination: { limit: 2, offset: 0, total: 4, count: 2, hasMore: true },
    };
    const page = new GenericPage<string>(client, data, { ...BASE_OPTS, query: { offset: 0 } } as any);

    expect(page.hasNextPage()).toBe(true);
    expect(page.hasPreviousPage()).toBe(false);
    await expect(page.getPreviousPage()).rejects.toThrow('No previous pages available');

    const nextData = {
      items: ['c', 'd'],
      pagination: { limit: 2, offset: 2, total: 4, count: 2, hasMore: false },
    };
    const spy = jest.spyOn(client as any, 'request').mockResolvedValue(nextData);

    const nextPage = await page.getNextPage();
    expect(spy).toHaveBeenCalled();
    expect(nextPage.data).toEqual(['c', 'd']);
    expect(nextPage.hasNextPage()).toBe(false);
    await expect(nextPage.getNextPage()).rejects.toThrow('No more pages available');

    spy.mockRestore();
  });

  it('getPreviousPage calls client.request and enforces boundaries', async () => {
    const client = new PayOS({ clientId: 'c', apiKey: 'k', checksumKey: 's' });
    const data = {
      items: ['c', 'd'],
      pagination: { limit: 2, offset: 2, total: 4, count: 2, hasMore: true },
    };
    const page = new GenericPage<string>(client, data, { ...BASE_OPTS, query: { offset: 2 } } as any);

    expect(page.hasPreviousPage()).toBe(true);

    const prevData = {
      items: ['a', 'b'],
      pagination: { limit: 2, offset: 0, total: 4, count: 2, hasMore: true },
    };
    const spy = jest.spyOn(client as any, 'request').mockResolvedValue(prevData);

    const prevPage = await page.getPreviousPage();
    expect(spy).toHaveBeenCalled();
    expect(prevPage.data).toEqual(['a', 'b']);

    spy.mockRestore();
  });

  it('async iteration and toArray collect all items via paging', async () => {
    const client = new PayOS({ clientId: 'c', apiKey: 'k', checksumKey: 's' });
    const page1 = {
      items: ['a', 'b'],
      pagination: { limit: 2, offset: 0, total: 4, count: 2, hasMore: true },
    };
    const page2 = {
      items: ['c', 'd'],
      pagination: { limit: 2, offset: 2, total: 4, count: 2, hasMore: false },
    };

    const p = new GenericPage<string>(client, page1 as any, BASE_OPTS);

    const spy = jest.spyOn(client as any, 'request').mockResolvedValue(page2);

    const collected: string[] = [];
    for await (const item of p) {
      collected.push(item);
    }
    expect(collected).toEqual(['a', 'b', 'c', 'd']);

    // toArray
    const p2 = new GenericPage<string>(client, page1 as any, BASE_OPTS);
    const spy2 = jest.spyOn(client as any, 'request').mockResolvedValue(page2);
    const arr = await p2.toArray();
    expect(arr).toEqual(['a', 'b', 'c', 'd']);

    spy.mockRestore();
    spy2.mockRestore();
  });
});
