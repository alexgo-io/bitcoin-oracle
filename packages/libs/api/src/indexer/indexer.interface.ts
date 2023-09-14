import { IndexerType, ModelOf } from '@alex-b20/types';

export abstract class Indexer {
  abstract upsertTxWithProof(
    tx: ModelOf<'indexer', 'tx_with_proofs'>,
  ): Promise<void>;
  abstract getBlockByBlockHash(
    header: string,
  ): Promise<ModelOf<'indexer', 'blocks'> | null>;
  abstract getLatestBlockNumberOfProof(
    type: IndexerType,
  ): Promise<bigint | null>;
}
