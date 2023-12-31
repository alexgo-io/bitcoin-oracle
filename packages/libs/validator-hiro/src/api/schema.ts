import {
  BigIntSchema,
  UpperCaseStringSchema,
} from '@meta-protocols-oracle/types';
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
    if (val.length === 0) {
      // decode as empty string to be filter out later
      return '';
    }
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

export const PKScriptToHiroAddressSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    if (val.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid PKScriptToHiroAddressSchema: empty string`,
      });
      return z.never();
    }
    try {
      return Address().encode(OutScript.decode(Buffer.from(val, 'hex')));
    } catch (e) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid PKScriptToHiroAddressSchema: [${val}]. ${e}`,
      });
    }
  } else {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid PKScriptToHiroAddressSchema: ${val}`,
    });
  }

  return z.never();
}, z.string());

export const HiroSatpointSchema = z.object({
  tx_id: z.string(),
  vout: BigIntSchema,
  satpoint: BigIntSchema,
});

const HiroSatpointStringSchema = z.preprocess((val, ctx) => {
  if (typeof val !== 'string') {
    ctx.addIssue({
      code: 'invalid_type',
      expected: 'string',
      received: typeof val,
    });
    return z.never();
  }
  const data = val.split(':');
  if (data.length !== 3) {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid satpoint: ${val}`,
    });
    return z.never();
  }

  const [tx_id, vout, satpoint] = data;
  return HiroSatpointSchema.parse({
    tx_id,
    vout,
    satpoint,
  });
}, HiroSatpointSchema);

const transfer_send = z.object({
  amount: HiroAmountBigIntSchema,
  from_address: HiroAddressToPKScriptSchema,
  to_address: HiroAddressToPKScriptSchema,
});

const activity = z.object({
  block_hash: z.string(),
  block_height: z.number(),
  inscription_id: z.string(),
  operation: z.string(),
  location: HiroSatpointStringSchema,
  ticker: UpperCaseStringSchema,
  timestamp: z.number(),
  transfer_send: transfer_send,
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
  ticker: UpperCaseStringSchema,
  available_balance: HiroAmountBigIntSchema,
  transferrable_balance: HiroAmountBigIntSchema,
  overall_balance: HiroAmountBigIntSchema,
});

const tokens = z.object({
  token: z.object({
    ticker: UpperCaseStringSchema,
    decimals: BigIntSchema,
  }),
});

export const HiroAPISchema = {
  activity: createPaginationSchema(activity),
  balance: createPaginationSchema(balance),
  tokens,
};

export type HiroAPIType<K extends keyof typeof HiroAPISchema> = z.infer<
  (typeof HiroAPISchema)[K]
>;

export const HiroSchema = {
  activity,
  balance,
  tokens,
};

export type HiroType<K extends keyof typeof HiroAPISchema> = z.infer<
  (typeof HiroSchema)[K]
>;
