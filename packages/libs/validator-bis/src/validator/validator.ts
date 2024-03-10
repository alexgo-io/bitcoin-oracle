import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { ApiClientService } from '@meta-protocols-oracle/api';
import { getLogger, stringifyJSON } from '@meta-protocols-oracle/commons';
import { getBitcoinTx$ } from '@meta-protocols-oracle/validator';
import assert from 'assert';
import {
  EMPTY,
  catchError,
  combineLatest,
  concatMap,
  map,
  mergeAll,
  mergeMap,
  of,
  retry,
  tap,
} from 'rxjs';
import {
  getActivityOnBlock$,
  getBalanceOnBlockInBatchQueue$,
  getTokenInfo$,
} from '../api/bis-api.rx';
import { getElectrumQueue } from '../queue';

const logger = getLogger('validator-bis');

export function getBisTxOnBlock$(block: number) {
  return getActivityOnBlock$(block).pipe(
    retry(10),
    map(result => {
      return result.data.filter(
        activity => activity.activity_type === 'transfer-transfer',
      );
    }),
    mergeAll(),
    mergeMap(activity => {
      if (activity.old_pkscript == null || activity.new_pkscript == null) {
        logger.error(
          `old_pkscript or new_pkscript is null for , inscription_id: ${activity.inscription_id}`,
        );
        return EMPTY;
      }

      if (BigInt(activity.amount) <= 0) {
        logger.error(
          `amount (${activity.amount}) less than 0 for inscription_id: ${activity.inscription_id}`,
        );
        return EMPTY;
      }

      return combineLatest([
        getBalanceOnBlockInBatchQueue$({
          pkscript: activity.old_pkscript,
          block_height: block + 1,
          ticker: activity.tick,
        }),
        getBalanceOnBlockInBatchQueue$({
          pkscript: activity.new_pkscript,
          block_height: block + 1,
          ticker: activity.tick,
        }),
      ]).pipe(
        concatMap(([oldBalance, newBalance]) => {
          if (
            BigInt(oldBalance.balance) < 0 ||
            BigInt(newBalance.balance) < 0
          ) {
            logger.error(
              `balance less than 0 for inscription_id: ${activity.inscription_id}`,
            );
            return EMPTY;
          }
          return of({
            ...activity,
            from_bal: oldBalance.balance,
            to_bal: newBalance.balance,
          });
        }),
      );
    }),
  );
}

function getSatpoint(tx: string) {
  const data = tx.split(':');
  assert(data.length === 3, `Invalid satpoint: ${tx}`);
  const [tx_id, vout, satpoint] = data;
  return {
    tx_id,
    vout,
    satpoint,
  };
}

export function getIndexerTxOnBlock$(block: number, api: ApiClientService) {
  return getBisTxOnBlock$(block).pipe(
    tap(() => {
      OTLP_Validator().counter['get-data-on-block'].add(1);
    }),
    mergeMap(tx => {
      const { tx_id, vout, satpoint } = getSatpoint(tx.new_satpoint);
      logger.debug(
        `getting bitcoin [${block}] tx: ${tx_id}, queue: ${
          getElectrumQueue().size
        }`,
      );
      return combineLatest([
        getBitcoinTx$(tx_id, api),
        getTokenInfo$(tx.tick),
      ]).pipe(
        map(([result, tokenInfo]) => {
          logger.log(`got bitcoin tx ${tx_id}`);
          return {
            ...tx,
            ...result,
            vout,
            tx_id,
            satpoint,
            decimals: tokenInfo.data.decimals,
          };
        }),
        catchError(err => {
          logger.error(`failed to get indexer tx ${tx_id}: ${err}.
          tx: ${stringifyJSON(tx)}
          `);
          return EMPTY;
        }),
      );
    }),
  );
}
