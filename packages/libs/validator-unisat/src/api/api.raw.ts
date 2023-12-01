import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import {
  getLogger,
  makeSafeAsyncFunction,
  parseErrorDetail,
} from '@meta-protocols-oracle/commons';
import got from 'got-cjs';
import { env } from '../env';

export const kUnisatPageLimit = 10000;

async function _getActivityOnBlock(
  block: number,
  start = 0,
  limit = kUnisatPageLimit,
) {
  const rawResult = await got(
    `${env().UNISAT_B20_API_URL}/v1/indexer/brc20/history-by-height/${block}`,
    {
      headers: {
        Authorization: `Bearer ${env().UNISAT_API_KEY}`,
      },
      searchParams: {
        start,
        limit,
      },
      retry: {
        limit: 10,
        // add retrying for 403 error code, due to unisat report 403 when rate limit hit
        statusCodes: [403, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      },
    },
  ).json();

  OTLP_Validator().counter['get-activity-on-block'].add(1);

  return rawResult;
}

export const getActivityOnBlock = makeSafeAsyncFunction(_getActivityOnBlock, {
  tapError: (error, [block, start, limit]) => {
    getLogger('getActivityOnBlock').error(
      `block: ${block}, start: ${start}, limit: ${limit}
 error: ${parseErrorDetail(error)}`,
    );
  },
});

async function _getBalanceOnBlock(
  address: string,
  block: number,
  start = 0,
  limit = kUnisatPageLimit,
) {
  // https://open-api.unisat.io/v1/indexer/address/{address}/brc20/summary-by-height/{height}
  const rawResult = await got(
    `${
      env().UNISAT_B20_API_URL
    }/v1/indexer/address/${address}/brc20/summary-by-height/${block}`,
    {
      headers: {
        Authorization: `Bearer ${env().UNISAT_API_KEY}`,
      },
      searchParams: {
        start,
        limit,
      },
      retry: {
        limit: 10,
        // add retrying for 403 error code, due to unisat report 403 when rate limit hit
        statusCodes: [403, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      },
    },
  ).json();

  OTLP_Validator().counter['get-balance-on-block'].add(1);

  return rawResult;
}

export const getBalanceOnBlock = makeSafeAsyncFunction(_getBalanceOnBlock, {
  tapError: (error, [address, block, start, limit]) => {
    getLogger('getBalanceOnBlock').error(
      `address: ${address}, block: ${block}, start: ${start}, limit: ${limit}
error: ${parseErrorDetail(error)}`,
    );
  },
});
