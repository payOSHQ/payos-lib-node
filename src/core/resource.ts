import { PayOS } from '../client';

export abstract class APIResource {
  protected _client: PayOS;

  constructor(client: PayOS) {
    this._client = client;
  }
}
