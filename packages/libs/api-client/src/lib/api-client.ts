import { indexer } from './indexer';

export class ApiClient {
  constructor(public readonly baseURL: string) {}
  indexer() {
    return indexer(this.baseURL);
  }
}

