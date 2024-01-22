import { IndexerModule } from '@bitcoin-oracle/api';
import { StacksCaller } from '@meta-protocols-oracle/brc20-indexer';
import { noAwait, SQL } from '@meta-protocols-oracle/commons';
import { PersistentService } from '@meta-protocols-oracle/persistent';
import { BufferStringSchema, m } from '@meta-protocols-oracle/types';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Command, Flags } from '@oclif/core';
import PQueue from 'p-queue';
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
  };

  async run(): Promise<void> {
    const {
      flags: { confirm },
    } = await this.parse(Check);
    if (confirm) {
      console.log(`confirming delete`);
    }
    const app = await NestFactory.create(IndexerModule);

    const persistent = app.get(PersistentService);

    const txs = await persistent.pgPool.any(SQL.type(
      m.database('indexer', 'submitted_tx'),
    )`
      select * from indexer.submitted_tx
      where submitter_nonce > 950
      and submitted_by = 'SP1RY4SKY4SNC9R426F19BA6JGXS9EZX5JN1BG66M'
      order by submitter_nonce desc
    `);

    console.log(`processing: ${txs.length} txs`);

    const readonly = this.stacks.readonlyCaller();
    const queue = new PQueue({ concurrency: 20 });
    const stacksIds = new Set<string>();
    for (const tx of txs) {
      noAwait(
        queue.add(async () => {
          const indexed = await readonly(
            'oracle-registry-v1-02',
            'get-bitcoin-tx-indexed-or-fail',
            {
              'bitcoin-tx': tx.tx_hash,
              offset: tx.satpoint,
              output: tx.output,
            },
          );

          console.log(
            `tx ${BufferStringSchema.parse(tx.stacks_tx_id)} is indexed: ${
              indexed.type
            }`,
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

      console.log(`deleted ${deleted.length} txs`);
    } else {
      console.log(`skipping delete`);
    }
  }
}
