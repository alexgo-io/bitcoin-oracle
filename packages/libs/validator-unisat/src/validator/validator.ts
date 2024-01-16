import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { indexer } from '@meta-protocols-oracle/api-client';
import {
  generateOrderHash,
  signOrderHash,
} from '@meta-protocols-oracle/brc20-indexer';
import {
  Unobservable,
  getLogger,
  stringifyJSON,
} from '@meta-protocols-oracle/commons';
import { Enums } from '@meta-protocols-oracle/types';
import { getBitcoinTx$ } from '@meta-protocols-oracle/validator';
import { Logger } from '@nestjs/common';
import { pubKeyfromPrivKey, publicKeyToString } from '@stacks/transactions';
import {
  EMPTY,
  combineLatest,
  concatMap,
  from,
  map,
  mergeAll,
  mergeMap,
  of,
  retry,
} from 'rxjs';
import { parseUnits } from 'viem';
import {
  PKScriptToUnisatAddressSchema,
  UnisatType,
  getAllActivitiesOnBlock$,
  getAllBalancesOnBlock$,
} from '../api';
import { env } from '../env';
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

export function getIndexerTxOnBlock$(block: number) {
  return getUnisatTxOnBlock$(block).pipe(
    mergeMap(tx => {
      OTLP_Validator().counter['get-data-on-block'].add(1);
      return getBitcoinTx$(tx.txid).pipe(
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

async function submitIndexerTx(
  tx: Unobservable<ReturnType<typeof getIndexerTxOnBlock$>>,
) {
  const order_hash = generateOrderHash({
    amt: parseUnits(tx.amount, tx.decimals),
    decimals: BigInt(tx.decimals),
    from: Buffer.from(tx.from, 'hex'),
    to: Buffer.from(tx.to, 'hex'),
    'from-bal': parseUnits(tx.from_bal, tx.decimals),
    'to-bal': parseUnits(tx.to_bal, tx.decimals),
    'bitcoin-tx': Buffer.from(tx.tx, 'hex'),
    tick: tx.ticker,
    output: BigInt(tx.vout),
    offset: BigInt(tx.offset),
  });
  const signature = await signOrderHash(
    env().STACKS_VALIDATOR_ACCOUNT_SECRET,
    order_hash,
  );
  const pubkey = publicKeyToString(
    pubKeyfromPrivKey(env().STACKS_VALIDATOR_ACCOUNT_SECRET),
  );
  logger.verbose(`submitting ${tx.txid}`);

  return indexer(env().INDEXER_API_URL)
    .txs()
    .post({
      type: Enums.ValidatorName.enum.unisat,
      header: tx.header,
      height: tx.height,
      tx_hash: tx.tx,
      satpoint: tx.offset.toString(),
      proof_hashes: tx.proof.hashes,
      tx_index: tx.proof['tx-index'].toString(10),
      tree_depth: tx.proof['tree-depth'].toString(10),
      from: tx.from,
      to: tx.to,
      output: tx.vout.toString(),
      tick: tx.ticker,
      amt: parseUnits(tx.amount, tx.decimals).toString(10),
      decimals: tx.decimals.toString(),
      from_bal: parseUnits(tx.from_bal, tx.decimals).toString(10),
      to_bal: parseUnits(tx.to_bal, tx.decimals).toString(10),
      order_hash: order_hash.toString('hex'),
      signature: signature.toString('hex'),
      signer: env().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
      signer_pubkey: pubkey,
    });
}

export function processBlock$(block: number) {
  return getIndexerTxOnBlock$(block).pipe(
    concatMap(tx => {
      return from(
        submitIndexerTx(tx).catch(err => {
          getLogger('validator-unisat').error(
            `error submitting tx: ${
              tx.txid
            }, error: ${err}, tx: ${stringifyJSON(tx)}`,
          );
        }),
      );
    }),
  );
}
