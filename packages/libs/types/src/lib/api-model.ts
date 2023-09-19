import { Enums } from '@alex-b20/types';
import { z } from 'zod';
import { BigIntStringSchema, BufferStringSchema } from './basic-model';

function createResponseSchema<ItemType extends z.ZodTypeAny>(
  itemSchema: ItemType,
) {
  return z.object({
    message: z.string(),
    data: itemSchema,
  });
}

const blocks = z.object({
  height: BigIntStringSchema,
  header: BufferStringSchema,
  block_hash: BufferStringSchema,
  canonical: z.boolean(),
});

const txs_post_response = createResponseSchema(z.undefined());

const txs = z.object({
  type: Enums.IndexerType,
  header: BufferStringSchema,
  height: BigIntStringSchema,
  tx_id: BufferStringSchema,
  output: BigIntStringSchema,
  satpoint: BigIntStringSchema,
  proof_hashes: z.array(BufferStringSchema),
  tx_index: BigIntStringSchema,
  tree_depth: BigIntStringSchema,
  from: BufferStringSchema,
  to: BufferStringSchema,
  tick: z.string(),
  amt: BigIntStringSchema,
  from_bal: BigIntStringSchema,
  to_bal: BigIntStringSchema,
});

const proofs = z.object({
  type: Enums.IndexerType,
  order_hash: BufferStringSchema,
  signature: BufferStringSchema,
  signer: z.string(),
});

const txs_with_proofs = txs.merge(proofs);

export const indexerJSON = {
  blocks,
  txs,
  txs_post_response,
  txs_with_proofs,
};
