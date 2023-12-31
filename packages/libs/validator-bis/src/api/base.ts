import {
  BigIntSchema,
  UpperCaseStringSchema,
} from '@meta-protocols-oracle/types';
import { ZodRawShape, z } from 'zod';

export const kBiSBaseURL = 'https://api.bestinslot.xyz';

export type ResultType<T> =
  | {
      type: 'success';
      data: T;
    }
  | {
      type: 'error';
      error: string;
    };

export const BISActivityTypeSchema = z.enum([
  'transfer-transfer',
  'transfer-inscribe',
  'mint-inscribe',
]);

export function withDataArraySchema<T extends ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  return z.object({
    data: z.array(schema),
    block_height: z.number(),
  });
}
export function withDataSchema<T extends ZodRawShape>(schema: z.ZodObject<T>) {
  return z.object({
    data: schema,
    block_height: z.number(),
  });
}

export const BISActivitySchema = z.object({
  inscription_id: z.string(),
  old_satpoint: z.string(),
  old_pkscript: z.string().nullish(),
  old_wallet: z.string().nullish(),
  new_pkscript: z.string(),
  new_wallet: z.string().nullish(),
  new_satpoint: z.string(),
  tick: UpperCaseStringSchema,
  amount: z.string(),
  activity_type: BISActivityTypeSchema,
});

export const BISActivityOnBlockResponseSchema =
  withDataArraySchema(BISActivitySchema);

export const BISBalanceSchema = z.object({
  tick: UpperCaseStringSchema,
  balance: z.string(),
});
export type BISBalance = z.infer<typeof BISBalanceSchema>;
export const BISBalanceOnBlockResponseSchema =
  withDataArraySchema(BISBalanceSchema);

export const BISTickerInfoSchema = z.object({
  ticker: UpperCaseStringSchema,
  decimals: BigIntSchema,
});
export const BISTickerInfoResponseSchema = withDataSchema(BISTickerInfoSchema);

export const BISBatchBalanceSchema = z.object({
  tick: UpperCaseStringSchema,
  balance: z.coerce.string().default('0'),
  pkscript: z.string(),
  block_height: z.number(),
});
export type BISBatchBalance = z.infer<typeof BISBatchBalanceSchema>;
export const BISBatchBalanceOnBlockResponseSchema = z.object({
  data: z.array(BISBatchBalanceSchema),
});
export type BISBatchBalanceOnBlockResponse = z.infer<
  typeof BISBatchBalanceOnBlockResponseSchema
>;
