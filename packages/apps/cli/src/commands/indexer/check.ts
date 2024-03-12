import { IndexerModule } from '@meta-protocols-oracle/api';
import { StacksCaller } from '@meta-protocols-oracle/brc20-indexer';
import {
  noAwait,
  sleep,
  SQL,
  stringifyJSON,
} from '@meta-protocols-oracle/commons';
import { PersistentService } from '@meta-protocols-oracle/persistent';
import { BufferStringSchema, m } from '@meta-protocols-oracle/types';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Command, Flags } from '@oclif/core';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { env } from '../../env';

export default class Check extends Command {
  private readonly logger = new Logger(Check.name);
  private readonly stacks = new StacksCaller(
    env().STACKS_RELAYER_ACCOUNT_SECRET!,
    env().STACKS_DEPLOYER_ACCOUNT_ADDRESS!,
  );

  static flags = {
    help: Flags.help({ char: 'h' }),
    confirm: Flags.boolean({ char: 'c', default: false }),
    'long-live': Flags.boolean({
      char: 'l',
      default: false,
      description: 'long live checker',
    }),
  };

  async check(confirm: boolean, longLive: boolean): Promise<void> {
    const app = await NestFactory.create(IndexerModule);
    const persistent = app.get(PersistentService);
    const txs = await (() => {
      // for long live, we check for only last 25 blocks
      if (longLive) {
        return persistent.pgPool.any(SQL.type(
          m.database('indexer', 'submitted_tx'),
        )`
        with pending_txs as (select *
                     from indexer.txs
                     where length(tx_hash) <= 4096*2
                     and height < (select max(height) - 15 from indexer.txs)
                     and height > (select max(height) - 100 from indexer.txs)
            ), qualified_txs as (select pt.id, count(*)
                       from pending_txs pt
                                join indexer.proofs pf on pt.id = pf.id
                           and ((pf."to" in
                                 (select address_to from indexer.whitelist_to_address))
                               or (pf."from" in
                                   (select address_to from indexer.whitelist_to_address)))
                       group by 1
                       having count(*) >=
                              (select minimal_proof_count
                               from indexer_config.relayer_configs
                               limit 1)
            ), qualified_txs_with_proof as (select qualified_txs.id
                                  from qualified_txs
                                           join pending_txs p on qualified_txs.id = p.id
            ), check_stacks_tx as (
                                   select *
                                   from indexer.submitted_tx st
                                   where st.id in (select id from qualified_txs_with_proof)
            )
select *
from check_stacks_tx
        `);
      } else {
        // for not long live we check everything
        return persistent.pgPool.any(SQL.type(
          m.database('indexer', 'submitted_tx'),
        )`
          with pending_txs as (select *
                               from indexer.txs
                               where length(tx_hash) <= 4096 * 2),
               qualified_txs as (select pt.id, count(*)
                                 from pending_txs pt
                                        join indexer.proofs pf on pt.id = pf.id
                                   and ((pf."to" in
                                         (select address_to from indexer.whitelist_to_address))
                                     or (pf."from" in
                                         (select address_to from indexer.whitelist_to_address)))

                                 group by 1
                                 having count(*) >=
                                        (select minimal_proof_count
                                         from indexer_config.relayer_configs
                                         limit 1)),
               qualified_txs_with_proof as (select qualified_txs.id
                                            from qualified_txs
                                                   join pending_txs p on qualified_txs.id = p.id),
               check_stacks_tx as (select *
                                   from indexer.submitted_tx st
                                   where st.id in (select id from qualified_txs_with_proof))

          select *
          from check_stacks_tx
        `);
      }
    })();

    console.log(`processing: ${txs.length} txs`);

    const readonly = this.stacks.readonlyCaller();
    const queue = new PQueue({ concurrency: 20 });
    const stacksIds = new Set<string>();
    for (const tx of txs) {
      noAwait(
        queue.add(async () => {
          const indexed = await pRetry(() =>
            readonly(
              'oracle-registry-v1-02',
              'get-bitcoin-tx-indexed-or-fail',
              {
                'bitcoin-tx': tx.tx_hash,
                offset: tx.satpoint,
                output: tx.output,
              },
            ),
          );

          if (tx.stacks_tx_id == null) {
            console.log(`null id: ${stringifyJSON(tx)}`);
            return;
          }

          console.log(
            `tx ${BufferStringSchema.parse(tx.stacks_tx_id)} is indexed: ${
              indexed.type
            }, pending: ${queue.pending}, size: ${queue.size}`,
          );
          if (indexed.type === 'error') {
            stacksIds.add(tx.stacks_tx_id!.toString('hex'));
          }
        }),
      );
    }
    await queue.onIdle();

    console.log(`waiting for ${stacksIds.size} txs to be indexed`);
    if (confirm) {
      const deleted = await persistent.pgPool.any(SQL.type(
        m.database('indexer', 'submitted_tx'),
      )`
        delete from indexer.submitted_tx
        where stacks_tx_id = any(${SQL.array(
          Array.from(stacksIds).map(id => Buffer.from(id, 'hex')),
          'bytea',
        )})
        returning *;
      `);

      if (deleted.length > 0) {
        console.log(`deleted ${deleted.length} txs`);
      }
    } else {
      console.log(`skipping delete`);
    }
  }

  async run(): Promise<void> {
    const {
      flags: { confirm, 'long-live': longLive },
    } = await this.parse(Check);
    if (confirm) {
      console.log(`confirming delete`);
    }

    if (longLive) {
      for (;;) {
        await this.check(true, true);
        await sleep(5 * 60e3);
      }
    } else {
      await this.check(confirm, false);
    }
  }
}
