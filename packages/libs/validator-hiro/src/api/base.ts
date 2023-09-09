import { Address, OutScript } from 'scure-btc-signer-cjs';
import { z } from 'zod';

export const HiroAmountBigIntSchema = z.preprocess((val, ctx) => {
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
export const HiroAddressToPKScriptSchema = z.preprocess((val, ctx) => {
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

export const HiroTransferSend = z.object({
  amount: HiroAmountBigIntSchema,
  from_address: HiroAddressToPKScriptSchema,
  to_address: HiroAddressToPKScriptSchema,
});

export const HiroResult = z.object({
  address: HiroAddressToPKScriptSchema,
  block_hash: z.string(),
  block_height: z.number(),
  inscription_id: z.string(),
  operation: z.string(),
  ticker: z.string(),
  timestamp: z.number(),
  transfer_send: HiroTransferSend.optional(),
  tx_id: z.string(),
});

export const HiroPaginationResponse = z.object({
  limit: z.number(),
  offset: z.number(),
  results: z.array(HiroResult),
  total: z.number(),
});
