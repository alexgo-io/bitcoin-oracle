import { z, ZodRawShape } from 'zod';

export const kBiSBaseURL = 'https://api.bestinslot.xyz';

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

export const BISActivitySchema = z.object({
  id: z.number(),
  inscription_id: z.string(),
  old_satpoint: z.string(),
  old_pkscript: z.string().nullish(),
  old_wallet: z.string().nullish(),
  new_pkscript: z.string(),
  new_wallet: z.string().nullish(),
  new_satpoint: z.string(),
  tick: z.string(),
  amount: z.string(),
  activity_type: BISActivityTypeSchema,
});

export const BISActivityOnBlockResponseSchema =
  withDataArraySchema(BISActivitySchema);

export const BISBalanceSchema = z.object({
  tick: z.string(),
  balance: z.string(),
  transferrable_balance: z.string(),
});
export type BISBalance = z.infer<typeof BISBalanceSchema>;
export const BISBalanceOnBlockResponseSchema =
  withDataArraySchema(BISBalanceSchema);
