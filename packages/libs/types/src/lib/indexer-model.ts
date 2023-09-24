import { z } from 'zod';
import { BigIntSchema, BufferSchema } from './basic-model';
import { Enums } from './enums-model';

/*
    "height"     integer     not null,
    "header"     bytea       not null unique,
    primary key ("height", "header"),
    "canonical"  boolean     not null,
 */

const txs = z.object({
  type: Enums.IndexerType,
  header: BufferSchema,
  height: BigIntSchema,
  tx_hash: BufferSchema,
  tx_id: BufferSchema,
  from_address: z.string(),
  to_address: z.string(),
  output: BigIntSchema,
  satpoint: BigIntSchema,
  proof_hashes: z.array(BufferSchema),
  tx_index: BigIntSchema,
  tree_depth: BigIntSchema,
  from: BufferSchema,
  to: BufferSchema,
  tick: z.string(),
  amt: BigIntSchema,
  from_bal: BigIntSchema,
  to_bal: BigIntSchema,
});

/*
    "type"       text        not null,
    "order_hash" bytea       not null,
    "signature"  bytea       not null,
    "signer"     text        not null,
 */

const proofs = z.object({
  type: Enums.IndexerType,
  order_hash: BufferSchema,
  signature: BufferSchema,
  signer: z.string(),
});

const tx_with_proofs = txs.merge(proofs);

const submitted_tx = z.object({
  tx_hash: BufferSchema,
  satpoint: BigIntSchema,
  output: BigIntSchema,
  stacks_tx_id: BufferSchema.nullable(),
  broadcast_result_type: z.enum(['ok', 'error']),
  error: z.string().nullish(),
  submitted_by: z.string(),
  submitted_at: z.date(),
});

const blocks = z.object({
  height: BigIntSchema,
  header: BufferSchema,
  block_hash: BufferSchema,
  canonical: z.boolean(),
});

export const indexer = {
  blocks,
  txs,
  proofs,
  tx_with_proofs,
  submitted_tx,
};
