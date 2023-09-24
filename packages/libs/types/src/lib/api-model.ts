/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import {
  BigIntSchema,
  BigIntStringSchema,
  BufferSchema,
  BufferStringSchema,
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

const blocks_response_json = z.object({
  height: BigIntStringSchema,
  header: BufferStringSchema,
  block_hash: BufferStringSchema,
  canonical: z.boolean(),
});

function makeBuffer<T extends 'json' | 'dto'>(
  type: T,
): T extends 'json' ? typeof BufferStringSchema : typeof BufferSchema {
  return (type === 'json' ? BufferStringSchema : BufferSchema) as any;
}

function makeBigInt<T extends 'json' | 'dto'>(
  type: T,
): T extends 'json' ? typeof BigIntStringSchema : typeof BigIntSchema {
  return (type === 'json' ? BigIntStringSchema : BigIntSchema) as any;
}

function makeTxs<T extends 'json' | 'dto'>(type: T) {
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
} as const;
