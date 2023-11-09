import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { getLogger, parseErrorDetail } from '@meta-protocols-oracle/commons';
import got from 'got-cjs';
import { env } from '../env';
import {
  BISActivityOnBlockResponseSchema,
  BISBatchBalanceOnBlockResponse,
  BISBatchBalanceOnBlockResponseSchema,
  BISTickerInfoResponseSchema,
  ResultType,
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

    OTLP_Validator().counter['get-activity-on-block'].add(1);

    return BISActivityOnBlockResponseSchema.parse(rawResult);
  } catch (e) {
    getLogger('getActivityOnBlock').error(parseErrorDetail(e));
    throw e;
  }
}

export async function getTokenInfo(token: string) {
  const url = `${kBiSBaseURL}/v3/brc20/ticker_info`;
  try {
    const rawResult = await got(url, {
      searchParams: { ticker: token },
      headers: {
        'x-api-key': env().BIS_ACCESS_KEY,
      },
      retry: {
        limit: 5,
        // add retrying for 400 error code
        statusCodes: [400, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      },
    }).json();

    OTLP_Validator().counter['get-token-info'].add(1);

    return BISTickerInfoResponseSchema.parse(rawResult);
  } catch (e) {
    getLogger('getTokenInfo').error(parseErrorDetail(e));
    throw e;
  }
}

export async function getBatchBalanceOnBlock(
  batches: { pkscript: string; block_height: number; ticker: string }[],
) {
  const url = `${kBiSBaseURL}/v3/brc20/batch_balance_on_block`;
  try {
    const rawResult = await got
      .post(url, {
        json: {
          queries: batches.map(batch => ({
            ...batch,
            ticker: batch.ticker.toLowerCase(),
          })),
        },
        headers: {
          'x-api-key': env().BIS_ACCESS_KEY,
        },
        retry: {
          limit: 5,
        },
      })
      .json();

    OTLP_Validator().counter['get-batch-balance-on-block'].add(1);

    return BISBatchBalanceOnBlockResponseSchema.parse(rawResult);
  } catch (e) {
    getLogger('getBatchBalanceOnBlock').error(parseErrorDetail(e));
    throw e;
  }
}

export async function safeGetBatchBalanceOnBlock(
  batches: { pkscript: string; block_height: number; ticker: string }[],
): Promise<ResultType<BISBatchBalanceOnBlockResponse>> {
  try {
    const result = await getBatchBalanceOnBlock(batches);
    return {
      type: 'success',
      data: result,
    };
  } catch (e) {
    return {
      type: 'error',
      error: parseErrorDetail(e),
    };
  }
}
