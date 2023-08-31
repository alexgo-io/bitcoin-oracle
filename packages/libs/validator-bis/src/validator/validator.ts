import { log } from '@alex-b20/commons';
import { combineLatest, map, mergeAll, mergeMap, of, retry, tap } from 'rxjs';
import { BISBalance } from '../api/base';
import { getActivityOnBlock$, getBalanceOnBlock$ } from '../api/bis-api.rx';

function getBalanceOnBlockCached$({
  address,
  block,
  cache,
}: {
  address?: string | null;
  block: number;
  cache: Map<string, BISBalance[]>;
}) {
  if (address == null) {
    return of(null);
  }
  const key = `${address}-${block}`;
  const val = cache.get(key);
  if (val != null) {
    return of(val);
  }
  return getBalanceOnBlock$(address, block).pipe(
    map(result => result.data /*?*/),
    tap(result => cache.set(key, result)),
    log('---'),
  );
}
function getBalance(balances: BISBalance[] | null, tick: string) {
  if (balances == null) {
    return null;
  }
  return balances.find(balance => balance.tick === tick);
}
export function getIndexerTxOnBlock(block: number) {
  const cache = new Map<string, BISBalance[]>();

  return getActivityOnBlock$(block).pipe(
    retry(5),
    map(result => {
      return result.data.filter(
        activity => activity.activity_type === 'transfer-transfer',
      );
    }),
    mergeAll(),
    mergeMap(activity => {
      return combineLatest([
        getBalanceOnBlockCached$({
          address: activity.old_pkscript,
          block: block + 1,
          cache,
        }),
        getBalanceOnBlockCached$({
          address: activity.new_pkscript,
          block: block + 1,
          cache,
        }),
      ]).pipe(
        retry(5),
        map(([oldBalances, newBalances]) => {
          const oldBalance = getBalance(oldBalances, activity.tick);
          const newBalance = getBalance(newBalances, activity.tick);
          return {
            ...activity,
            from_bal: oldBalance?.balance ?? '0',
            to_bal: newBalance?.balance ?? '0',
          };
        }),
      );
    }, 10),

  );
}
