import { indexer } from '@alex-b20/api-client';
import { generateOrderHash, signOrderHash } from '@alex-b20/brc20-indexer';
import { Logger } from '@nestjs/common';
import assert from 'assert';
import {
  Observable,
  combineLatest,
  concatMap,
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
import { env } from '../env';
import { getElectrumQueue } from '../queue';
import { getBitcoinTx$ } from '../valiadtor-lib/validator-lib';

const logger = new Logger('validator', { timestamp: true });
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
  );
}
function getBalance(balances: BISBalance[] | null, tick: string) {
  if (balances == null) {
    return null;
  }
  return balances.find(balance => balance.tick === tick);
}
export function getBisTxOnBlock$(block: number) {
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
      const { tx_id, vout, satpoint } = getSatpoint(tx.old_satpoint);
      logger.debug(
        `getting bitcoin tx: ${tx_id}, queue: ${getElectrumQueue().size}`,
      );
      return getBitcoinTx$(tx_id).pipe(
        map(result => {
          logger.log(`got bitcoin tx ${tx_id}`);
          return {
            ...tx,
            ...result,
            vout,
            tx_id,
            satpoint,
          };
        }),
      );
    }),
  );
}

type Unobservable<T> = T extends Observable<infer R> ? R : T;

async function submitIndexerTx(
  tx: Unobservable<ReturnType<typeof getIndexerTxOnBlock$>>,
) {
  assert(
    tx.old_pkscript != null,
    `old_pkscript is null for ${tx.tx_id}, inscription_id: ${tx.inscription_id}`,
  );

  const order_hash = generateOrderHash({
    amt: BigInt(tx.amount),
    from: Buffer.from(tx.old_pkscript, 'hex'),
    offset: 0n,
    'from-bal': BigInt(tx.from_bal),
    to: Buffer.from(tx.new_pkscript, 'hex'),
    'to-bal': BigInt(tx.to_bal),
    'bitcoin-tx': Buffer.from(tx.tx_id, 'hex'),
    tick: tx.tick,
    output: BigInt(tx.vout),
  });
  const signature = await signOrderHash(
    env().STACKS_VALIDATOR_ACCOUNT_SECRET,
    order_hash,
  );

  return indexer(env().INDEXER_URL)
    .txs()
    .post({
      type: 'bis',
      header: tx.header,
      height: tx.height,
      tx_id: tx.tx_id,
      satpoint: tx.satpoint,
      proof_hashes: tx.proof.hashes,
      tx_index: tx.proof['tx-index'].toString(10),
      tree_depth: tx.proof['tree-depth'].toString(10),
      from: tx.old_pkscript ?? '', // TODO: refine model
      to: tx.new_pkscript ?? '', // TODO: refine model
      output: tx.vout,
      tick: tx.tick,
      amt: tx.amount,
      from_bal: tx.from_bal,
      to_bal: tx.to_bal,
      order_hash: order_hash.toString('hex'),
      signature: signature.toString('hex'),
      signer: env().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
    });
}

export function processBlock$(block: number) {
  return getIndexerTxOnBlock$(block).pipe(
    concatMap(tx => {
      return from(submitIndexerTx(tx));
    }),
  );
}
