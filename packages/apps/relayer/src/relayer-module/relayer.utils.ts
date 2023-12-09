import { filterNotEmpty } from '@meta-protocols-oracle/commons';
import assert from 'assert';
import got from 'got-cjs';
import memoizee from 'memoizee';
import { countBy, pipe, sort, toPairs } from 'ramda';

async function getWhitelistBRC20Tokens() {
  const data = await got('https://hasura-console.alexlab.co/v1/graphql', {
    method: 'POST',
    json: {
      query:
        '{\n  tokenCollection {\n    items {\n      tags\n      name\n      id\n    }\n  }\n}\n',
      variables: null,
    },
  }).json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data as any)['data']['tokenCollection']['items'];
  const brc20Tokens = items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => {
      const id = item['id'];
      if (id.startsWith('brc20-')) {
        const name = item['name'];
        assert(name, `name is null for ${id}`);
        return name.toUpperCase();
      }

      return null;
    })
    .filter(filterNotEmpty);

  if (brc20Tokens.length === 0) {
    throw new Error('brc20Tokens.length === 0');
  }

  return brc20Tokens;
}

export const getWhitelistBRC20TokensCached = memoizee(getWhitelistBRC20Tokens, {
  maxAge: 1000 * 60 * 60,
  promise: true,
});

export function getMajorityProofs<T extends { order_hash: Buffer }>(
  proofs: T[],
  minimalProofCount: number,
) {
  const count = pipe(
    countBy((p: { order_hash: Buffer }) => p.order_hash.toString('hex')),
    toPairs,
    sort((a, b) => b[1] - a[1]),
  )(proofs);

  const winnerProofs = count[0]; //?
  if (winnerProofs == null) {
    return null;
  }

  if (winnerProofs[1] < minimalProofCount) {
    return null;
  }

  const winnerOrderHash = winnerProofs[0];

  const selectedProofs = proofs.filter(
    p => p.order_hash.toString('hex') === winnerOrderHash,
  );

  return selectedProofs;
}

/*?
getMajorityProofs(
  [
    { order_hash: Buffer.from('2'), a: 1 },
    { order_hash: Buffer.from('1'), b: 2 },
    { order_hash: Buffer.from('1'), c: 3 },
    { order_hash: Buffer.from('1'), c: 3 },
  ],
  2,
);
*/
