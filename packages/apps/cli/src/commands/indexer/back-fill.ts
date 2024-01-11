import { IndexerModule } from '@bitcoin-oracle/api';
import {
  kIndexerRegistryName,
  StacksCaller,
} from '@meta-protocols-oracle/brc20-indexer';
import { fastRetry, noAwait, SQL } from '@meta-protocols-oracle/commons';
import { PersistentService } from '@meta-protocols-oracle/persistent';
import {
  BigIntSchema,
  BufferHexSchema,
  kTxMaxLength,
} from '@meta-protocols-oracle/types';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Command } from '@oclif/core';
import PQueue from 'p-queue';
import { z } from 'zod';
import { env } from '../../env';

export default class BackFill extends Command {
  private readonly logger = new Logger(BackFill.name);
  private readonly stacks = new StacksCaller(
    env().STACKS_RELAYER_ACCOUNT_SECRET!,
    env().STACKS_DEPLOYER_ACCOUNT_ADDRESS!,
  );

  async run(): Promise<void> {
    const app = await NestFactory.create(IndexerModule);

    const persistent = app.get(PersistentService);

    const txs = await persistent.pgPool.query(SQL.type(
      z.object({
        tx_hash: BufferHexSchema,
        satpoint: BigIntSchema,
        output: BigIntSchema,
      }),
    )`
      select pf.tx_hash, pf.satpoint, pf.output
      from indexer.proofs pf
      where (pf."to" in (select address_to from indexer.whitelist_to_address) or
             (pf."from" in (select address_to from indexer.whitelist_to_address)))
        and length(tx_hash) <= ${kTxMaxLength}
      group by 1,2,3
    `);

    const queue = new PQueue();
    const pendingTxsRows: [...typeof txs.rows] = [];
    for (const tx of txs.rows) {
      noAwait(
        queue.add(async () => {
          const isIndexedTx = await fastRetry(
            () =>
              this.stacks.readonlyCaller()(
                kIndexerRegistryName,
                'get-bitcoin-tx-indexed-or-fail',
                {
                  'bitcoin-tx': tx.tx_hash,
                  offset: tx.satpoint,
                  output: tx.output,
                },
              ),
            'get-bitcoin-tx-indexed-or-fail',
          );
          if (isIndexedTx.type === 'error') {
            this.logger.log(
              `tx ${tx.tx_hash.toString(
                'hex',
              )} is not indexed, satpoint: ${tx.satpoint.toString()}, output: ${tx.output.toString()}`,
            );
            pendingTxsRows.push(tx);
          } else {
            // this.logger.debug(
            //   `tx ${tx.tx_hash.toString(
            //     'hex',
            //   )} is indexed, satpoint: ${tx.satpoint.toString()}, output: ${tx.output.toString()}`,
            // );
          }
        }),
      );
    }

    await queue.onIdle();

    this.logger.log(`pending txs: ${pendingTxsRows.length}`);

    const removeSubmitTxs = async () => {
      await persistent.pgPool.transaction(async conn => {
        for (const tx of pendingTxsRows) {
          const rs = await conn.query(SQL.typeAlias('any')`
        delete from indexer.submitted_tx
          where tx_hash = ${SQL.binary(tx.tx_hash)}
          and satpoint = ${tx.satpoint.toString()}
          and output = ${tx.output.toString()}
        returning *;
        `);

          if (rs.rows.length > 0) {
            this.logger.log(
              `deleted ${rs.rows.length} rows, for tx ${tx.tx_hash.toString(
                'hex',
              )}`,
            );
          } else {
            this.logger.log(
              `no rows deleted, for tx ${tx.tx_hash.toString('hex')}`,
            );
          }
        }
      });
    };

    await removeSubmitTxs();
  }
}
