/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import {
  BigIntSchema,
  BigIntStringSchema,
  BufferHexSchema,
  BufferStringSchema,
  DateSchema,
} from './basic-model';
import { Enums } from './enums-model';

function createResponseSchema<ItemType extends z.ZodTypeAny>(
  itemSchema: ItemType,
) {
  return z.object({
    message: z.string(),
    data: itemSchema,
  });
}

type DataType = 'json' | 'dto';

const blocks_response_json = z.object({
  height: BigIntStringSchema,
  header: BufferStringSchema,
  block_hash: BufferStringSchema,
  canonical: z.boolean(),
});

function makeBuffer<T extends DataType>(
  type: T,
): T extends 'json' ? typeof BufferStringSchema : typeof BufferHexSchema {
  return (type === 'json' ? BufferStringSchema : BufferHexSchema) as any;
}

function makeBigInt<T extends DataType>(
  type: T,
): T extends 'json' ? typeof BigIntStringSchema : typeof BigIntSchema {
  return (type === 'json' ? BigIntStringSchema : BigIntSchema) as any;
}

function makeTxs<T extends DataType>(type: T) {
  return z.object({
    type: Enums.ValidatorName,
    header: makeBuffer(type),
    height: makeBigInt(type),
    tx_hash: makeBuffer(type),
    output: makeBigInt(type),
    satpoint: makeBigInt(type),
    proof_hashes: z.array(makeBuffer(type)),
    tx_index: makeBigInt(type),
    tree_depth: makeBigInt(type),
    from: makeBuffer(type),
    to: makeBuffer(type),
    tick: z.string(),
    amt: makeBigInt(type),
    from_bal: makeBigInt(type),
    to_bal: makeBigInt(type),
    order_hash: makeBuffer(type),
    signature: makeBuffer(type),
    signer: z.string(),
  });
}

function makeDebugRequestQuery<T extends DataType>(type: T) {
  return z.object({
    tx_id: makeBuffer(type).optional(),
    tx_hash: makeBuffer(type).optional(),
    header: makeBuffer(type).optional(),
    tx_index: makeBigInt(type).optional(),
    stacks_error: z.string().optional(),
    tx_error: z.string().optional(),
    output: makeBigInt(type).optional(),
    satpoint: makeBigInt(type).optional(),
    height: makeBigInt(type).optional(),
    stacks_tx_id: makeBuffer(type).optional(),
    stacks_submitted_by: z.string().optional(),
    stacks_submitter_nonce: makeBigInt(type).optional(),
    stacks_broadcast_result: z.string().optional(),
    block_hash: makeBuffer(type).optional(),
    block_header: makeBuffer(type).optional(),
  });
}

function makeDebugResponseQuery<T extends DataType>(type: T) {
  return z.object({
    tx_hash: makeBuffer(type),
    output: makeBigInt(type),
    satpoint: makeBigInt(type),
    tx_id: makeBuffer(type),
    header: makeBuffer(type),
    proof_hashes: z.array(makeBuffer(type)),
    tx_index: makeBigInt(type),
    tree_depth: makeBigInt(type),
    height: makeBigInt(type),
    tx_error: z.string().optional(),
    proofs_count: makeBigInt(type),
    proofs: z.array(
      z.object({
        type: z.string(),
        from_address: z.string(),
        to_address: z.string(),
        amt: makeBigInt(type),
        from: makeBuffer(type),
        to: makeBuffer(type),
        tick: z.string(),
        from_bal: makeBigInt(type),
        to_bal: makeBigInt(type),
        satpoint: makeBigInt(type),
        output: makeBigInt(type),
        signer: z.string(),
        signature: makeBuffer(type),
        order_hash: makeBuffer(type),
      }),
    ),
    stacks_tx_id: makeBuffer(type).nullable(),
    stacks_submitted_by: z.string().nullable(),
    stacks_submitted_at: DateSchema.nullable(),
    stacks_submitter_nonce: makeBigInt(type).nullable(),
    stacks_broadcast_result: z.string().nullable(),
    stacks_error: z.string().nullable(),
    block_hash: makeBuffer(type),
    block_header: makeBuffer(type),
  });
}

export const indexerAPI = {
  blocks: {
    response: {
      json: blocks_response_json,
    },
  },
  txs: {
    request: {
      json: makeTxs('json'),
      dto: makeTxs('dto'),
    },
    response: {
      json: createResponseSchema(z.undefined()),
    },
  },
  debug_txs: {
    request: {
      json: makeDebugRequestQuery('json'),
      dto: makeDebugRequestQuery('dto'),
    },
    response: {
      json: makeDebugResponseQuery('json'),
      dto: makeDebugResponseQuery('dto'),
    },
  },
} as const;
