import { filterNotEmpty } from '@meta-protocols-oracle/commons';
import got from 'got-cjs';
import memoizee from 'memoizee';

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
      const m = item['id'].match(/^brc20-(.*)$/);
      if (m != null) {
        return m[1].toUpperCase();
      } else {
        return null;
      }
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

getWhitelistBRC20TokensCached(); //?
