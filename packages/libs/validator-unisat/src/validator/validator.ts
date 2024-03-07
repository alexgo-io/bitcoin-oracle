import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { ApiClientService } from '@meta-protocols-oracle/api';
import { getBitcoinTx$ } from '@meta-protocols-oracle/validator';
import { Logger } from '@nestjs/common';
import {
  EMPTY,
  combineLatest,
  concatMap,
  map,
  mergeAll,
  mergeMap,
  of,
  retry,
} from 'rxjs';
import {
  PKScriptToUnisatAddressSchema,
  UnisatType,
  getAllActivitiesOnBlock$,
  getAllBalancesOnBlock$,
} from '../api';
import { getUnisatQueue } from '../queue';

const logger = new Logger('unisat', { timestamp: true });
function getBalance(balances: UnisatType<'balance'>[] | null, tick: string) {
  if (balances == null) {
    return null;
  }
  return balances.find(balance => balance.ticker === tick);
}
export function getUnisatTxOnBlock$(block: number) {
  return getAllActivitiesOnBlock$(block).pipe(
    retry(10),
    map(result => {
      return result.filter(
        activity =>
          activity.type === 'transfer' &&
          activity.from.length > 0 &&
          activity.to.length > 0,
      );
    }),
    mergeAll(),
    mergeMap(activity => {
      return combineLatest([
        getAllBalancesOnBlock$(
          block,
          PKScriptToUnisatAddressSchema.parse(activity.from),
        ),
        getAllBalancesOnBlock$(
          block,
          PKScriptToUnisatAddressSchema.parse(activity.to),
        ),
      ]).pipe(
        retry(5),
        concatMap(([oldBalances, newBalances]) => {
          logger.verbose(
            `got [getUnisatTxOnBlock$] for tx ${
              activity.txid
            } - ${block} - [q:${getUnisatQueue().size}]`,
          );

          const oldBalance = getBalance(oldBalances, activity.ticker);
          const newBalance = getBalance(newBalances, activity.ticker);
          const decimals = newBalance?.decimal ?? oldBalance?.decimal;
          if (oldBalance == null || newBalance == null || decimals == null) {
            return EMPTY;
          }

          return of({
            ...activity,
            from_bal: oldBalance.overallBalance,
            to_bal: newBalance.overallBalance,
            decimals: decimals,
          });
        }),
      );
    }),
  );
}

export function getIndexerTxOnBlock$(block: number, api: ApiClientService) {
  return getUnisatTxOnBlock$(block).pipe(
    mergeMap(tx => {
      OTLP_Validator().counter['get-data-on-block'].add(1);
      return getBitcoinTx$(tx.txid, api).pipe(
        map(result => {
          return {
            ...tx,
            ...result,
          };
        }),
      );
    }),
  );
}
