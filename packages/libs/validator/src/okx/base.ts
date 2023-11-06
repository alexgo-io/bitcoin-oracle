import { z } from 'zod';

export const kOKXBaseURL = 'https://www.okx.com/api/v1/endpoints/btc';
export const OKXActionTypeSchema = z.enum([
  'deploy',
  'mint',
  'inscribeTransfer',
  'transfer',
]);
export type OKXActionType = z.infer<typeof OKXActionTypeSchema>;
