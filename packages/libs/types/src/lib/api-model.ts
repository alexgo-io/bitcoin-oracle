import { z } from 'zod';
import { BigIntStringSchema, BufferStringSchema } from './basic-model';

import { IndexerTypeSchema } from './enum-model';

function createResponseSchema<ItemType extends z.ZodTypeAny>(
  itemSchema: ItemType,
) {
  return z.object({
    message: z.string(),
    data: itemSchema,
  });
}

export const IndexerTxsPostResponseSchema = createResponseSchema(z.undefined());
export type IndexerTxsPostResponse = z.infer<
  typeof IndexerTxsPostResponseSchema
>;

export const IndexerTxJSONSchema = z.object({
  type: IndexerTypeSchema,
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
export type IndexerTxJSON = z.infer<typeof IndexerTxJSONSchema>;

export const IndexerProofJSONSchema = z.object({
  type: IndexerTypeSchema,
  order_hash: BufferStringSchema,
  signature: BufferStringSchema,
  signer: z.string(),
});
export type IndexerProofJSON = z.infer<typeof IndexerProofJSONSchema>;

export const IndexerTxWithProofJSONSchema = IndexerTxJSONSchema.merge(
  IndexerProofJSONSchema,
);
export type IndexerTxWithProofJSON = z.infer<
  typeof IndexerTxWithProofJSONSchema
>;
