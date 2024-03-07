import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { ApiClientService } from '@meta-protocols-oracle/api';
import { getBitcoinTx$ } from '@meta-protocols-oracle/validator';
import { Logger } from '@nestjs/common';
import { combineLatest, map, mergeAll, mergeMap, retry } from 'rxjs';
import {
  HiroType,
  PKScriptToHiroAddressSchema,
  getAllActivitiesOnBlock$,
  getAllBalancesOnBlock$,
  getTokenInfo$,
} from '../api';

const logger = new Logger('hiro', { timestamp: true });
function getBalance(balances: HiroType<'balance'>[] | null, tick: string) {
  if (balances == null) {
    return null;
  }
  return balances.find(balance => balance.ticker === tick);
}
export function getHiroTxOnBlock$(block: number) {
  return getAllActivitiesOnBlock$(block, 60).pipe(
    retry(10),
    map(result => {
      return result.filter(
        activity =>
          activity.transfer_send != null &&
          activity.transfer_send.from_address.length > 0 &&
          activity.transfer_send.to_address.length > 0,
      );
    }),
    mergeAll(),
    mergeMap(activity => {
      return combineLatest([
        getAllBalancesOnBlock$(
          block,
          PKScriptToHiroAddressSchema.parse(
            activity.transfer_send.from_address,
          ),
        ),
        getAllBalancesOnBlock$(
          block,
          PKScriptToHiroAddressSchema.parse(activity.transfer_send.to_address),
        ),
        getTokenInfo$(activity.ticker),
      ]).pipe(
        retry(5),
        map(([oldBalances, newBalances, token]) => {
          logger.verbose(
            `got [getHiroTxOnBlock$] for tx ${activity.tx_id} - ${block}`,
          );

          const oldBalance = getBalance(oldBalances, activity.ticker);
          const newBalance = getBalance(newBalances, activity.ticker);
          return {
            ...activity,
            from_bal: oldBalance?.overall_balance ?? '0',
            to_bal: newBalance?.overall_balance ?? '0',
            decimals: token.token.decimals,
          };
        }),
      );
    }),
  );
}

export function getIndexerTxOnBlock$(block: number, api: ApiClientService) {
  return getHiroTxOnBlock$(block).pipe(
    mergeMap(tx => {
      OTLP_Validator().counter['get-data-on-block'].add(1);
      return getBitcoinTx$(tx.location.tx_id, api).pipe(
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
