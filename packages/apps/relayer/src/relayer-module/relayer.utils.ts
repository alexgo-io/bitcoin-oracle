import { filterNotEmpty } from '@meta-protocols-oracle/commons';
import assert from 'assert';
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
