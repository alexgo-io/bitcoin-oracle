import { z } from 'zod';
import {
  BigIntSchema,
  BufferHexSchema,
  DateSchema,
  UpperCaseStringSchema,
} from './basic-model';
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
  output: BigIntSchema,
  satpoint: BigIntSchema,
  proof_hashes: z.array(BufferHexSchema),
  tx_index: BigIntSchema,
  tree_depth: BigIntSchema,
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
  tick: UpperCaseStringSchema,
  to: BufferHexSchema,
  to_bal: BigIntSchema,
  decimals: BigIntSchema,

  from_address: z.string(),
  to_address: z.string(),
  tx_id: BufferHexSchema,

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
  submitted_at: DateSchema.nullish(),
  submitter_nonce: BigIntSchema.nullish(),
});

const blocks = z.object({
  height: BigIntSchema,
  header: BufferHexSchema,
  block_hash: BufferHexSchema,
  canonical: z.boolean(),
});

const query_proofs = z.object({
  type: Enums.ValidatorName,
  order_hash: BufferHexSchema,
  signature: BufferHexSchema,
  signer: z.string(),

  amt: BigIntSchema,
  from: BufferHexSchema,
  from_bal: BigIntSchema,
  satpoint: BigIntSchema,
  output: BigIntSchema,
  tick: UpperCaseStringSchema,
  to: BufferHexSchema,
  to_bal: BigIntSchema,
  decimals: BigIntSchema,

  tx_id: BufferHexSchema,
});

const has_id = z.object({ id: BufferHexSchema });

const validated_txs = z.object({
  tx_hash: BufferHexSchema,
  order_hash: BufferHexSchema,
  amt: BigIntSchema,
  bitcoin_tx: BufferHexSchema,
  decimals: BigIntSchema,
  from: BufferHexSchema,
  from_bal: BigIntSchema,
  offset: BigIntSchema,
  output: BigIntSchema,
  tick: UpperCaseStringSchema,
  to: BufferHexSchema,
  to_bal: BigIntSchema,
  tx_id: BufferHexSchema,
  proof_hashes: z.array(BufferHexSchema),
  tx_index: BigIntSchema,
  tree_depth: BigIntSchema,
  height: BigIntSchema,
  signers: z.array(z.string()),
  signer_types: z.array(Enums.ValidatorName),
  signatures: z.array(BufferHexSchema),
  created_at: DateSchema.optional(),
  updated_at: DateSchema.optional(),
});
export const indexer = {
  blocks,
  txs,
  proofs,
  tx_with_proofs,
  submitted_tx,
  has_id,
  query_proofs,
  validated_txs,
};
