import {
  getBitcoinData$,
  getBitcoinTxData,
  withElectrumClient,
} from '@alex-b20/bitcoin';
import { log } from '@alex-b20/commons';
import assert from 'assert';
import {
  Observable,
  combineLatest,
  from,
  map,
  mergeAll,
  mergeMap,
  of,
  retry,
  tap,
} from 'rxjs';
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
    map(result => result.data),
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
export function getBisTxOnBlock(block: number) {
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

function getSatpoint(tx: string) {
  const data = tx.split(':');
  assert(data.length === 3, `Invalid satpoint: ${tx}`);
  const [txId, vout, satoshis] = data;
  return {
    txId,
    vout,
    satoshis,
  };
}

export function getIndexerTxOnBlock(block: number) {
  return getBisTxOnBlock(block).pipe(
    mergeMap(tx => {
      const { txId, vout } = getSatpoint(tx.old_satpoint);
      return getBitcoinData$([txId]).pipe(
        map(result => {
          return {
            ...tx,
            ...result,
            vout,
          };
        }),
      );
    }),
  );
}

export function getIndexerTxOnBlock2(block: number) {
  return new Observable(subscriber => {
    withElectrumClient(async client => {
      getBisTxOnBlock(block)
        .pipe(
          mergeMap(tx => {
            const { txId, vout } = getSatpoint(tx.old_satpoint);
            return from(getBitcoinTxData(txId, client)).pipe(
              map(result => {
                return {
                  ...tx,
                  ...result,
                  vout,
                };
              }),
            );
          }),
        )
        .subscribe(subscriber);
    }).catch(error => {
      subscriber.error(error);
    });
  });
}
