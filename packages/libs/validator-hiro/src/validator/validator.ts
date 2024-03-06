import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { ApiClient } from '@meta-protocols-oracle/api';
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
  combineLatest,
  concatMap,
  from,
  map,
  mergeAll,
  mergeMap,
  retry,
} from 'rxjs';
import {
  HiroType,
  PKScriptToHiroAddressSchema,
  getAllActivitiesOnBlock$,
  getAllBalancesOnBlock$,
  getTokenInfo$,
} from '../api';
import { env } from '../env';

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

export function getIndexerTxOnBlock$(block: number) {
  return getHiroTxOnBlock$(block).pipe(
    mergeMap(tx => {
      OTLP_Validator().counter['get-data-on-block'].add(1);
      return getBitcoinTx$(tx.location.tx_id).pipe(
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
    amt: tx.transfer_send.amount,
    decimals: tx.decimals,
    from: Buffer.from(tx.transfer_send.from_address, 'hex'),
    to: Buffer.from(tx.transfer_send.to_address, 'hex'),
    'from-bal': BigInt(tx.from_bal),
    'to-bal': BigInt(tx.to_bal),
    'bitcoin-tx': Buffer.from(tx.tx, 'hex'),
    tick: tx.ticker,
    output: BigInt(tx.location.vout),
    offset: BigInt(tx.location.satpoint),
  });
  const signature = await signOrderHash(
    env().STACKS_VALIDATOR_ACCOUNT_SECRET,
    order_hash,
  );

  logger.verbose(`submitting ${tx.tx_id}`);
  const pubkey = publicKeyToString(
    pubKeyfromPrivKey(env().STACKS_VALIDATOR_ACCOUNT_SECRET),
  );

  const api = new ApiClient(env().INDEXER_API_URL);

  return api
    .indexer()
    .txs()
    .post({
      type: Enums.ValidatorName.enum.hiro,
      header: tx.header,
      height: tx.height,
      tx_hash: tx.tx,
      satpoint: tx.location.satpoint.toString(),
      proof_hashes: tx.proof.hashes,
      tx_index: tx.proof['tx-index'].toString(10),
      tree_depth: tx.proof['tree-depth'].toString(10),
      from: tx.transfer_send.from_address,
      to: tx.transfer_send.to_address,
      output: tx.location.vout.toString(),
      tick: tx.ticker,
      amt: tx.transfer_send.amount.toString(),
      decimals: tx.decimals.toString(),
      from_bal: tx.from_bal.toString(),
      to_bal: tx.to_bal.toString(),
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
          getLogger('validator-hiro').error(
            `error submitting tx: ${
              tx.tx_id
            }, error: ${err}, tx: ${stringifyJSON(tx)}`,
          );
        }),
      );
    }),
  );
}
