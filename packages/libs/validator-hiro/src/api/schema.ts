import { Address, OutScript } from 'scure-btc-signer-cjs';
import { z } from 'zod';

const HiroAmountBigIntSchema = z.preprocess((val, ctx) => {
  if (val instanceof BigInt) {
    return val;
  }
  if (typeof val === 'string') {
    return BigInt(val.replace('.', ''));
  }
  ctx.addIssue({
    code: 'custom',
    message: `Invalid HiroAmountBigIntSchema: ${val}`,
  });
  return z.never;
}, z.bigint());
const HiroAddressToPKScriptSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    try {
      return Buffer.from(OutScript.encode(Address().decode(val))).toString(
        'hex',
      );
    } catch (e) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid HiroAddressToPKScriptSchema: [${val}]. ${e}`,
      });
    }
  } else {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid HiroAddressToPKScriptSchema: ${val}`,
    });
  }

  return z.never();
}, z.string());

const transfer_send = z.object({
  amount: HiroAmountBigIntSchema,
  from_address: HiroAddressToPKScriptSchema,
  to_address: HiroAddressToPKScriptSchema,
});

const activity = z.object({
  address: HiroAddressToPKScriptSchema,
  block_hash: z.string(),
  block_height: z.number(),
  inscription_id: z.string(),
  operation: z.string(),
  ticker: z.string(),
  timestamp: z.number(),
  transfer_send: transfer_send.optional(),
  tx_id: z.string(),
});

function createPaginationSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    limit: z.number(),
    offset: z.number(),
    results: z.array(schema),
    total: z.number(),
  });
}

const balance = z.object({
  ticker: z.string(),
  available_balance: HiroAmountBigIntSchema,
  transferrable_balance: HiroAmountBigIntSchema,
  overall_balance: HiroAmountBigIntSchema,
});

/// exports
export const HiroAPISchema = {
  activity: createPaginationSchema(activity),
  balance: createPaginationSchema(balance),
};

export type HiroAPIType<K extends keyof typeof HiroAPISchema> = z.infer<
  (typeof HiroAPISchema)[K]
>;

export const HiroSchema = {
  activity,
  balance,
};

export type HiroType<K extends keyof typeof HiroAPISchema> = z.infer<
  (typeof HiroSchema)[K]
>;
