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

let i = 0;
export async function getBalanceOnBlock(address: string, block: number) {
  console.log(`getBalanceOnBlock(${address}, ${block}), ${i++}`);
  const rawResult = await got(
    `${
      env().HIRO_B20_API_URL
    }/v3/brc20/balance_on_block?pkscript=${address}&block_height=${block}`,
    {},
  ).json();

  return rawResult;
}
