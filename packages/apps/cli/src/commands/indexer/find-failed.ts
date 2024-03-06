import { Indexer, IndexerModule } from '@meta-protocols-oracle/api';
import {
  StacksCaller,
  kIndexerRegistryName,
} from '@meta-protocols-oracle/brc20-indexer';
import { fastRetry, noAwait } from '@meta-protocols-oracle/commons';
import { NestFactory } from '@nestjs/core';
import { Command, Flags } from '@oclif/core';
import crypto from 'crypto';
import PQueue from 'p-queue';
import { env } from '../../env';

function shardIndex(key: string) {
  return (
    BigInt(
      '0x' +
        crypto
          .createHash('sha256')
          .update(key)
          .digest()
          .toString('hex')
          .substring(0, 20),
    ) % 6n
  );
}

export default class World extends Command {
  static description = 'a command';
  private readonly stacks = new StacksCaller(
    env().STACKS_RELAYER_ACCOUNT_SECRET!,
    env().STACKS_DEPLOYER_ACCOUNT_ADDRESS!,
  );

  static flags = {
    help: Flags.help({ char: 'h' }),
    height: Flags.integer({ char: 'h', default: 0 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(World);
    const { height } = flags;
    console.log(
      `db: ${env().NODE_DATABASE_URL}, checking for height: ${height}`,
    );

    const app = await NestFactory.create(IndexerModule);

    const indexer = app.get(Indexer);

    const txs = await indexer.findDebugInfo({ height: BigInt(height) });
    console.log(`got ${txs.length} txs to check`);

    const queue = new PQueue();

    for (const tx of txs) {
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
            console.log(
              `${tx.tx_id.toString('hex')} | ${tx.satpoint} | ${tx.output} | ${
                tx.stacks_submitted_by
              } | shard: ${shardIndex(
                tx.tx_id.toString('hex'),
              )} | ${tx.stacks_tx_id?.toString('hex')}`,
            );
          } else {
            console.log(
              `${tx.tx_id.toString('hex')} | ${tx.satpoint} | ${tx.output} | ${
                tx.stacks_submitted_by
              } | shard: ${shardIndex(tx.tx_id.toString('hex'))} | indexed`,
            );
          }
        }),
      );
    }

    await queue.onIdle();
  }
}
