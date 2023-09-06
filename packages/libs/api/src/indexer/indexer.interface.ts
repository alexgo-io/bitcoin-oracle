import { IndexerBlock, IndexerTxWithProof, IndexerType } from '@alex-b20/types';

export abstract class Indexer {
  abstract upsertTxWithProof(tx: IndexerTxWithProof): Promise<void>;
  abstract getBlockByBlockHash(header: string): Promise<IndexerBlock | null>;
  abstract getLatestBlockNumberOfProof(
    type: IndexerType,
  ): Promise<bigint | null>;
}
