import { getLogger } from '@meta-protocols-oracle/commons';
import got from 'got-cjs';
import { env } from '../env';
import {
  BISActivityOnBlockResponseSchema,
  BISBalanceOnBlockResponseSchema,
  kBiSBaseURL,
} from './base';

export async function getActivityOnBlock(block: number) {
  const url = `${kBiSBaseURL}/v3/brc20/activity_on_block?block_height=${block}`;
  try {
    const rawResult = await got(url, {
      headers: {
        'x-api-key': env().BIS_ACCESS_KEY,
      },
      retry: {
        limit: 5,
        // #ref: https://github.com/sindresorhus/got/blob/main/documentation/7-retry.md
        // add retrying for 400 error code
        statusCodes: [400, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      },
    }).json();

    return BISActivityOnBlockResponseSchema.parse(rawResult);
  } catch (e) {
    getLogger('getActivityOnBlock').error(`
     error on url: ${url}
     error: ${e}
    `);
    throw e;
  }
}

export async function getBalanceOnBlock(address: string, block: number) {
  const url = `${kBiSBaseURL}/v3/brc20/balance_on_block?pkscript=${address}&block_height=${block}`;
  try {
    const rawResult = await got(url, {
      headers: {
        'x-api-key': env().BIS_ACCESS_KEY,
      },
      retry: {
        limit: 5,
        // add retrying for 400 error code
        statusCodes: [400, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      },
    }).json();

    return BISBalanceOnBlockResponseSchema.parse(rawResult);
  } catch (e) {
    getLogger('getBalanceOnBlock').error(`
     error on url: ${url}
     error: ${e}
    `);
    throw e;
  }
}
