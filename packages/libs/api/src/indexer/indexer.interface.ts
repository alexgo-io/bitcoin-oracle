/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIOf, ModelOf, ValidatorName } from '@bitcoin-oracle/types';

export class IndexerError extends Error {}

export abstract class Indexer {
  abstract upsertTxWithProof(tx: APIOf<'txs', 'request', 'dto'>): Promise<void>;
  abstract getBlockByBlockHash(
    header: string,
  ): Promise<ModelOf<'indexer', 'blocks'> | null>;
  abstract getLatestBlockNumberOfProof(
    type: ValidatorName,
  ): Promise<bigint | null>;

  abstract findDebugInfo(
    params: APIOf<'debug_txs', 'request', 'dto'>,
  ): Promise<readonly APIOf<'debug_txs', 'response', 'dto'>[]>;
}

export interface MockIndexer {
  validateOrderHash(tx: APIOf<'txs', 'request', 'dto'>): Promise<void>;
}
