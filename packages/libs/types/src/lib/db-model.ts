import { z } from 'zod';
import { BigIntSchema, BufferSchema } from './basic-model';
import { IndexerTypeSchema } from './enum-model';

/*
    "height"     integer     not null,
    "header"     bytea       not null unique,
    primary key ("height", "header"),
    "canonical"  boolean     not null,
 */

export const IndexerBlockSchema = z.object({
  height: z.bigint(),
  header: z.string(),
  canonical: z.boolean(),
});
export type IndexerBlock = z.infer<typeof IndexerBlockSchema>;

/*
  "type"         text        not null,
  "header"       bytea       not null,
-- bitcoin height
  "height"       integer     not null,
  "tx_id"        bytea       not null,
  "output"       integer     not null,
  "satpoint"     integer     not null,
  "proof_hashes" bytea[]     not null,
  "tx_index"     integer     not null,
  "tree_depth"   integer     not null,
  "from"         bytea       not null,
  "to"           bytea       not null,
  "tick"         text        not null,
  "amt"          numeric     not null,
  "from_bal"     numeric     not null,
  "to_bal"       numeric     not null,
  "created_at"   timestamptz not null default now(),
  unique ("header", "tx_id", "satpoint", "output"),
  "updated_at"   timestamptz not null default now()
 */

export const IndexerTxSchema = z.object({
  type: IndexerTypeSchema,
  header: BufferSchema,
  height: BigIntSchema,
  tx_id: BufferSchema,
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
export type IndexerTx = z.infer<typeof IndexerTxSchema>;

/*
    "type"       text        not null,
    "order_hash" bytea       not null,
    "signature"  bytea       not null,
    "signer"     text        not null,
 */

export const IndexerProofSchema = z.object({
  type: IndexerTypeSchema,
  order_hash: BufferSchema,
  signature: BufferSchema,
  signer: z.string(),
});
export type IndexerProof = z.infer<typeof IndexerProofSchema>;

export const IndexerTxWithProofSchema =
  IndexerTxSchema.merge(IndexerProofSchema);
export type IndexerTxWithProof = z.infer<typeof IndexerTxWithProofSchema>;
