import got from 'got-cjs';
import { env } from '../env';
import {
  BISActivityOnBlockResponseSchema,
  BISBalanceOnBlockResponseSchema,
  kBiSBaseURL,
} from './base';

export async function getActivityOnBlock(block: number) {
  const rawResult = await got(
    `${kBiSBaseURL}/v3/brc20/activity_on_block?block_height=${block}`,
    {
      headers: {
        'x-api-key': env().BIS_ACCESS_KEY,
      },
    },
  ).json();

  return BISActivityOnBlockResponseSchema.parse(rawResult);
}

export async function getBalanceOnBlock(address: string, block: number) {
  const rawResult = await got(
    `${kBiSBaseURL}/v3/brc20/balance_on_block?pkscript=${address}&block_height=${block}`,
    {
      headers: {
        'x-api-key': env().BIS_ACCESS_KEY,
      },
    },
  ).json();

  return BISBalanceOnBlockResponseSchema.parse(rawResult);
}
