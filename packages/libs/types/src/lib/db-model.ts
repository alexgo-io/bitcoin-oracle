import { z } from 'zod';
import { BigIntSchema, BufferHexSchema, UpperCaseStringSchema } from "./basic-model";
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
  submitted_at: z.date().nullish(),
  submitter_nonce: BigIntSchema.nullish(),
});

const blocks = z.object({
  height: BigIntSchema,
  header: BufferHexSchema,
  block_hash: BufferHexSchema,
  canonical: z.boolean(),
});

const relayer_txs = txs.merge(
  z.object({
    proofs: z.array(
      z.object({
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

        tx_id: BufferHexSchema,
      }),
    ),
  }),
);

export const indexer = {
  blocks,
  txs,
  proofs,
  tx_with_proofs,
  submitted_tx,
  relayer_txs,
};
