import { z } from 'zod';

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

export const BufferSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    return Buffer.from(
      val.length >= 2 && val[1] === 'x' ? val.slice(2) : val,
      'hex',
    );
  }
  if (val instanceof Buffer) {
    return val;
  }
  ctx.addIssue({
    message: `val is not a buffer: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.instanceof(Buffer)) as z.ZodType<Buffer, z.ZodTypeDef, Buffer>;

export const BigIntSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'bigint') {
    return val;
  }
  if (typeof val === 'string') {
    if (val.endsWith('n')) {
      return BigInt(val.slice(0, -1));
    }
    return BigInt(val);
  }
  if (typeof val === 'number') {
    return BigInt(val);
  }
  ctx.addIssue({
    message: `val is not a bigint: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.bigint());

export const IndexerTypeSchema = z.enum(['bis', 'okx']);

export const IndexerTxSchema = z.object({
  type: IndexerTypeSchema,
  header: BufferSchema,
  height: BigIntSchema,
  tx_id: BufferSchema,
  proof_hashes: z.array(BufferSchema),
  tx_index: BigIntSchema,
  tree_depth: BigIntSchema,
  from: BufferSchema,
  to: BufferSchema,
  output: BigIntSchema,
  tick: z.string(),
  amt: BigIntSchema,
  bitcoin_tx: BufferSchema,
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
