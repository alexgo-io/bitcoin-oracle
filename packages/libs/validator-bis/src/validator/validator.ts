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
import assert from 'assert';
import {
  EMPTY,
  catchError,
  combineLatest,
  concatMap,
  from,
  map,
  mergeAll,
  mergeMap,
  of,
  retry,
} from 'rxjs';
import { BISBalance } from '../api/base';
import {
  getActivityOnBlock$,
  getBalanceOnBlock$,
  getTokenInfo$,
} from '../api/bis-api.rx';
import { env } from '../env';
import { getElectrumQueue } from '../queue';

const logger = getLogger('validator-bis');
function getBalanceOnBlockCached$({
  address,
  block,
}: {
  address?: string | null;
  block: number;
}) {
  if (address == null) {
    return of(null);
  }
  return getBalanceOnBlock$(address, block).pipe(map(result => result.data));
}
function getBalance(balances: BISBalance[] | null, tick: string) {
  if (balances == null) {
    return null;
  }
  return balances.find(balance => balance.tick === tick);
}
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
      return combineLatest([
        getBalanceOnBlockCached$({
          address: activity.old_pkscript,
          block: block + 1,
        }),
        getBalanceOnBlockCached$({
          address: activity.new_pkscript,
          block: block + 1,
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

export function getIndexerTxOnBlock$(block: number) {
  return getBisTxOnBlock$(block).pipe(
    mergeMap(tx => {
      const { tx_id, vout, satpoint } = getSatpoint(tx.new_satpoint);
      logger.debug(
        `getting bitcoin [${block}] tx: ${tx_id}, queue: ${
          getElectrumQueue().size
        }`,
      );
      return combineLatest([getBitcoinTx$(tx_id), getTokenInfo$(tx.tick)]).pipe(
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

async function submitIndexerTx(
  tx: Unobservable<ReturnType<typeof getIndexerTxOnBlock$>>,
) {
  assert(
    tx.old_pkscript != null,
    `old_pkscript is null for ${tx.tx_id}, inscription_id: ${tx.inscription_id}`,
  );

  const order_hash = generateOrderHash({
    amt: BigInt(tx.amount),
    decimals: BigInt(tx.decimals),
    from: Buffer.from(tx.old_pkscript, 'hex'),
    to: Buffer.from(tx.new_pkscript, 'hex'),
    'from-bal': BigInt(tx.from_bal),
    'to-bal': BigInt(tx.to_bal),
    'bitcoin-tx': Buffer.from(tx.tx, 'hex'),
    tick: tx.tick,
    output: BigInt(tx.vout),
    offset: BigInt(tx.satpoint),
  });
  const signature = await signOrderHash(
    env().STACKS_VALIDATOR_ACCOUNT_SECRET,
    order_hash,
  );

  return indexer(env().INDEXER_API_URL)
    .txs()
    .post({
      type: Enums.ValidatorName.enum.bis,
      header: tx.header,
      height: tx.height,
      tx_hash: tx.tx,
      satpoint: tx.satpoint,
      proof_hashes: tx.proof.hashes,
      tx_index: tx.proof['tx-index'].toString(10),
      tree_depth: tx.proof['tree-depth'].toString(10),
      from: tx.old_pkscript ?? '', // TODO: refine model
      to: tx.new_pkscript ?? '', // TODO: refine model
      output: tx.vout,
      tick: tx.tick,
      amt: tx.amount,
      decimals: tx.decimals.toString(10),
      from_bal: tx.from_bal,
      to_bal: tx.to_bal,
      order_hash: order_hash.toString('hex'),
      signature: signature.toString('hex'),
      signer: env().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
    });
}

const heightCounter: Record<string, number> = {};
export function processBlock$(block: number) {
  return getIndexerTxOnBlock$(block).pipe(
    concatMap(tx => {
      heightCounter[tx.height] = (heightCounter[tx.height] ?? 0) + 1;
      const count = heightCounter[tx.height];
      logger.verbose(`submitting tx: ${tx.tx_id} - ${tx.height} - ${count}`);
      return from(
        submitIndexerTx(tx)
          .then(response => {
            logger.verbose(
              `submitted tx: ${tx.tx_id}: ${JSON.stringify(
                response,
              )} - ${count}`,
            );
            return response;
          })
          .catch(err => {
            logger.verbose(
              `failed to submit tx: ${tx.tx_id}: ${JSON.stringify(
                err,
              )} - ${count} - ${stringifyJSON(tx)}`,
            );
            throw err;
          }),
      );
    }),
  );
}
