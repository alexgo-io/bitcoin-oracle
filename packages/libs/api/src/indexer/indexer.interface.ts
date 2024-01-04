/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  APIOf,
  BigIntSchema,
  BufferHexSchema,
  DateSchema,
  ModelOf,
  PKScriptBufferSchema,
  UpperCaseStringSchema,
  ValidatorName,
} from '@meta-protocols-oracle/types';
import { z } from 'zod';

export class IndexerError extends Error {}

export const ValidatedTxsQuerySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('id'),
    tx_hash: BufferHexSchema,
    output: BigIntSchema,
    offset: BigIntSchema,
  }),
  z.object({
    type: z.literal('id2'),
    tx_hash: BufferHexSchema,
    order_hash: BufferHexSchema,
  }),
  z.object({
    type: z.literal('to'),
    to: BufferHexSchema,
    after_updated_at: DateSchema.optional(),
    limit: z.coerce.number().optional().default(10000),
  }),
  z.object({
    type: z.literal('indexing'),
    tick: z.array(UpperCaseStringSchema).optional(),
    from: z.array(PKScriptBufferSchema).optional(),
    to: z.array(PKScriptBufferSchema).optional(),
    height: z.array(z.number().int()).optional(),
    limit: z.coerce.number().optional().default(10000),
  }),
]);
export type ValidatedTxsQuery = z.infer<typeof ValidatedTxsQuerySchema>;

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

  abstract getValidatedTxs(
    query: ValidatedTxsQuery,
  ): Promise<readonly APIOf<'validated_txs', 'response', 'json'>[]>;

  abstract getLatestBlockInRange(
    type: ValidatorName,
    from: bigint,
    to: bigint,
  ): Promise<bigint | null>;
}

export interface MockIndexer {
  validateOrderHash(tx: APIOf<'txs', 'request', 'dto'>): Promise<void>;
}
