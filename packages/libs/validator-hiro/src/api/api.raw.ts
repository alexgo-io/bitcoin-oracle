import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import got from 'got-cjs';
import { env } from '../env';

export async function getActivityOnBlock(
  block: number,
  offset = 0,
  limit = 60,
) {
  const rawResult = await got(
    `${env().HIRO_B20_API_URL}/ordinals/v1/brc-20/activity`,
    {
      headers: {
        'x-hiro-api-key': env().HIRO_API_KEY,
      },
      searchParams: {
        block_height: block,
        operation: 'transfer_send',
        offset,
        limit,
      },
    },
  ).json();

  OTLP_Validator().counter['get-activity-on-block'].add(1);

  return rawResult;
}

export async function getBalanceOnBlock(
  address: string,
  block: number,
  offset = 0,
  limit = 60,
) {
  const rawResult = await got(
    `${env().HIRO_B20_API_URL}/ordinals/v1/brc-20/balances/${address}`,
    {
      headers: {
        'x-hiro-api-key': env().HIRO_API_KEY,
      },
      searchParams: {
        block_height: block,
        offset,
        limit,
      },
    },
  ).json();

  OTLP_Validator().counter['get-balance-on-block'].add(1);

  return rawResult;
}

export async function getTokenInfo(token: string) {
  const rawResult = await got(
    `${env().HIRO_B20_API_URL}/ordinals/v1/brc-20/tokens/${encodeURIComponent(
      token,
    )}`,
    {
      headers: {
        'x-hiro-api-key': env().HIRO_API_KEY,
      },
    },
  ).json();

  OTLP_Validator().counter['get-token-info'].add(1);

  return rawResult;
}
