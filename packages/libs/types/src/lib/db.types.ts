import { z } from 'zod';
import {Simplify} from "@t3-oss/env-core";

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
    "height"       integer     not null,
    "tx_id"        bytea       not null,
    "proof_hashes" bytea[]     not null,
    "tx_index"     integer     not null,
    "tree_depth"   integer     not null,
    "from"         bytea       not null,
    "to"           bytea       not null,
    "output"       integer     not null,
    "tick"         text        not null,
    "amt"          numeric     not null,
    "bitcoin_tx"   bytea       not null,
    "from_bal"     numeric     not null,
    "to_bal"       numeric     not null,
 */

export const BufferSchema = z.instanceof(Buffer);
export const IndexerTxSchema = z.object({
  type: z.string(),
  header: BufferSchema,
  height: z.bigint(),
  tx_id: BufferSchema,
  proof_hashes: z.array(BufferSchema),
  tx_index: z.bigint(),
  tree_depth: z.bigint(),
  from: BufferSchema,
  to: BufferSchema,
  output: z.bigint(),
  tick: z.string(),
  amt: z.bigint(),
  bitcoin_tx: BufferSchema,
  from_bal: z.bigint(),
  to_bal: z.bigint(),
});
export type IndexerTx = z.infer<typeof IndexerTxSchema>;

/*
    "type"       text        not null,
    "order_hash" bytea       not null,
    "signature"  bytea       not null,
    "signer"     text        not null,
 */

export const IndexerProofSchema = z.object({
  type: z.string(),
  order_hash: BufferSchema,
  signature: BufferSchema,
  signer: z.string(),
});
export type IndexerProof = z.infer<typeof IndexerProofSchema>;

export type IndexerTxWithProof = Required<Simplify<IndexerTx & IndexerProof>>;
