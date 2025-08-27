import { PayOS } from '../client';
import { APIResponse } from './api-response';
import { FinalRequestOptions } from './request-options';

export interface ListParams {
  limit?: number;
  offset?: number;
  [key: string]: any;
}

/**
 * Abstract base class for paginated API responses.
 * Provides both async iteration and manual pagination methods.
 */
export abstract class Page<Item> implements AsyncIterable<Item> {
  protected _client: PayOS;
  protected _data: Item[];
  protected _pagination: Pagination;
  protected _options: FinalRequestOptions<any>;

  constructor(client: PayOS, data: any, options: FinalRequestOptions<any>) {
    this._client = client;
    this._options = options;

    if (data) {
      this._pagination = data.pagination;
      // Get the first array property from data (could be 'payouts', 'items', etc.)
      const dataKeys = Object.keys(data).filter((key) => key !== 'pagination');
      this._data = dataKeys.length > 0 ? (data[dataKeys[0]] as Item[]) : [];
    } else {
      this._data = [];
      this._pagination = {
        limit: 0,
        offset: 0,
        total: 0,
        count: 0,
        hasMore: false,
      };
    }
  }

  /**
   * The items in the current page
   */
  get data(): Item[] {
    return this._data;
  }

  /**
   * Pagination information for the current page
   */
  get pagination(): Pagination {
    return this._pagination;
  }

  /**
   * Check if there are more pages available
   */
  hasNextPage(): boolean {
    return this._pagination.hasMore;
  }

  /**
   * Get the next page of results
   */
  async getNextPage(): Promise<this> {
    if (!this.hasNextPage()) {
      throw new Error('No more pages available');
    }

    const nextOffset = this._pagination.offset + this._pagination.count;
    const nextOptions = {
      ...this._options,
      query: {
        ...this._options.query,
        offset: nextOffset,
        limit: this._pagination.limit,
      },
    };

    const response = await this._client.request<any>(nextOptions);
    return this.createPageInstance(this._client, response, nextOptions) as this;
  }

  /**
   * Check if there are previous pages available
   */
  hasPreviousPage(): boolean {
    return this._pagination.offset > 0;
  }

  /**
   * Get the previous page of results
   */
  async getPreviousPage(): Promise<this> {
    if (!this.hasPreviousPage()) {
      throw new Error('No previous pages available');
    }

    const prevOffset = Math.max(0, this._pagination.offset - this._pagination.limit);
    const prevOptions = {
      ...this._options,
      query: {
        ...this._options.query,
        offset: prevOffset,
        limit: this._pagination.limit,
      },
    };

    const response = await this._client.request<any>(prevOptions);
    return this.createPageInstance(this._client, response, prevOptions) as this;
  }

  /**
   * Abstract method to create a new page instance
   * Must be implemented by subclasses
   */
  protected abstract createPageInstance(
    client: PayOS,
    data: any,
    options: FinalRequestOptions<any>,
  ): Page<Item>;

  /**
   * Async iterator implementation for automatic pagination
   */
  async *[Symbol.asyncIterator](): AsyncIterator<Item> {
    const iterate = async function* (page: Page<Item>): AsyncGenerator<Item> {
      for (const item of page.data) {
        yield item;
      }

      // If there are more pages, recurse to next page
      if (page.hasNextPage()) {
        const next = await page.getNextPage();
        for await (const item of iterate(next)) {
          yield item;
        }
      }
    };

    for await (const item of iterate(this)) {
      yield item;
    }
  }

  /**
   * Collect all items from all pages into an array
   */
  async toArray(): Promise<Item[]> {
    const items: Item[] = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  }
}

/**
 * Generic paginated response class that can be used for any item type
 */
export class GenericPage<Item> extends Page<Item> {
  protected createPageInstance(
    client: PayOS,
    data: any,
    options: FinalRequestOptions<any>,
  ): GenericPage<Item> {
    return new GenericPage<Item>(client, data, options);
  }
}

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
  count: number;
  hasMore: boolean;
};

export type PagResponse<T> = APIResponse<
  {
    pagination: Pagination;
  } & Record<string, T[] | any>
>;
