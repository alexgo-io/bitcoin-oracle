import {
  APIOf,
  ModelIndexer,
  ValidatorName,
} from '@meta-protocols-oracle/types';

export abstract class ApiClientService {
  abstract indexer(): {
    txs(): {
      post(
        params: APIOf<'txs', 'request', 'json'>,
      ): Promise<APIOf<'txs', 'response', 'json'> | { message: string }>;
    };
    block(): {
      get(params: { block_hash: string }): Promise<ModelIndexer<'blocks'>>;
    };
    latest_block_number(): {
      get(params: {
        type: ValidatorName | string;
      }): Promise<{ latest_block_number: number | null }>;
    };
    latest_block_number_range(): {
      get(params: {
        type: ValidatorName | string;
        from: number;
        to: number;
      }): Promise<{ latest_block_number: number | null }>;
    };
  };
}
