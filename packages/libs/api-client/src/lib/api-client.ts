import { indexer } from './indexer';

export class ApiClient {
  constructor(public readonly baseURL: string) {}

  indexer() {
    indexer(this.baseURL);
  }
}

