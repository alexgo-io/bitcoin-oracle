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
      searchParams: {
        block_height: block,
        operation: 'transfer_send',
        offset,
        limit,
      },
    },
  ).json();

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
      searchParams: {
        block_height: block,
        offset,
        limit,
      },
    },
  ).json();

  return rawResult;
}

export async function getTokenInfo(token: string) {
  const rawResult = await got(
    `${env().HIRO_B20_API_URL}/ordinals/v1/brc-20/tokens/${token}`,
  ).json();

  return rawResult;
}
