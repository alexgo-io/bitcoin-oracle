import { APIOf, ValidatorName, ModelOf } from '@alex-b20/types';

export abstract class Indexer {
  abstract upsertTxWithProof(tx: APIOf<'txs', 'request', 'dto'>): Promise<void>;
  abstract getBlockByBlockHash(
    header: string,
  ): Promise<ModelOf<'indexer', 'blocks'> | null>;
  abstract getLatestBlockNumberOfProof(
    type: ValidatorName,
  ): Promise<bigint | null>;
}
