import { IndexerTxWithProof } from '@alex-b20/types';

export abstract class Indexer {
  abstract upsertTxWithProof(tx: IndexerTxWithProof): Promise<void>;
}
