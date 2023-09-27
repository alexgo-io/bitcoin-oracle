import { z } from 'zod';
import { BigIntSchema, BufferHexSchema } from './basic-model';
import { Enums } from './enums-model';

/*
    "height"     integer     not null,
    "header"     bytea       not null unique,
    primary key ("height", "header"),
    "canonical"  boolean     not null,
 */

const txs = z.object({
  header: BufferHexSchema,
  height: BigIntSchema,
  tx_hash: BufferHexSchema,
  tx_id: BufferHexSchema,
  from_address: z.string(),
  to_address: z.string(),
  output: BigIntSchema,
  satpoint: BigIntSchema,
  proof_hashes: z.array(BufferHexSchema),
  tx_index: BigIntSchema,
  tree_depth: BigIntSchema,
  from: BufferHexSchema,
  to: BufferHexSchema,
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
  type: Enums.ValidatorName,
  order_hash: BufferHexSchema,
  signature: BufferHexSchema,

  amt: BigIntSchema,
  tx_hash: BufferHexSchema,
  from: BufferHexSchema,
  from_bal: BigIntSchema,
  satpoint: BigIntSchema,
  output: BigIntSchema,
  tick: z.string(),
  to: BufferHexSchema,
  to_bal: BigIntSchema,

  signer: z.string(),
});

const tx_with_proofs = txs.merge(proofs);

const submitted_tx = z.object({
  tx_hash: BufferHexSchema,
  satpoint: BigIntSchema,
  output: BigIntSchema,
  stacks_tx_id: BufferHexSchema.nullish(),
  broadcast_result_type: z.enum(['ok', 'error', 'settled']),
  error: z.string().nullish(),
  submitted_by: z.string().nullish(),
  submitted_at: z.date().nullish(),
});

const blocks = z.object({
  height: BigIntSchema,
  header: BufferHexSchema,
  block_hash: BufferHexSchema,
  canonical: z.boolean(),
});

export const indexer = {
  blocks,
  txs,
  proofs,
  tx_with_proofs,
  submitted_tx,
};
