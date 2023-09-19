import {
  calculateBlockHash,
  getBitcoinBlockHeaderByHeights,
  getCurrentBitcoinHeader,
} from '@alex-b20/bitcoin';
import { sleep } from '@alex-b20/commons';
import { Inject, Logger } from '@nestjs/common';
import { range } from 'ramda';
import { env } from '../env';
import { BitcoinSyncWorkerService } from './bitcoin-sync-worker.interface';
import { BitcoinSyncWorkerRepository } from './bitcoin-sync-worker.repository';

export class DefaultBitcoinSyncWorkerService
  implements BitcoinSyncWorkerService
{
  private readonly logger = new Logger(DefaultBitcoinSyncWorkerService.name);
  constructor(
    @Inject(BitcoinSyncWorkerRepository)
    private readonly repository: BitcoinSyncWorkerRepository,
  ) {}
  async start(): Promise<void> {
    await this.sync();
    // await this.syncMissingBlocks();
  }

  async sync() {
    // noinspection InfiniteLoopJS
    for (;;) {
      await this.syncMissingBlocks();
      const fromHeight = await this.getFromBlockHeight$();
      const toHeight = await this.getToBlockHeight$();
      await this.syncFrom(fromHeight, toHeight);

      await sleep(env().BITCOIN_SYNC_POLL_INTERVAL);
    }
  }

  async getFromBlockHeight$() {
    const dbLast = await this.repository.latestBlock();

    return Number(
      dbLast?.height ?? BigInt(env().BITCOIN_SYNC_GENESIS_BLOCK_HEIGHT),
    );
  }

  async getToBlockHeight$() {
    return (await getCurrentBitcoinHeader()).height;
  }

  async syncMissingBlocks() {
    const missingBlocks = await this.repository.getMissingBlocks(
      env().BITCOIN_SYNC_GENESIS_BLOCK_HEIGHT,
    );
    await getBitcoinBlockHeaderByHeights(
      missingBlocks.rows.map(i => Number(i.missing_block)),
      async (h, height) => {
        const header = Buffer.from(h, 'hex');
        await this.repository.upsertBlock({
          height: BigInt(height),
          header,
          block_hash: calculateBlockHash(header),
          canonical: true,
        });
        this.logger.debug(`synced block ${height}`);
      },
    );
  }

  async syncFrom(fromHeight: number, toHeight: number) {
    this.logger.verbose(`syncing from ${fromHeight} to ${toHeight}`);
    await getBitcoinBlockHeaderByHeights(
      range(fromHeight, toHeight),
      async (h, height) => {
        const header = Buffer.from(h, 'hex');
        await this.repository.upsertBlock({
          height: BigInt(height),
          header,
          block_hash: calculateBlockHash(header),
          canonical: true,
        });
        this.logger.debug(`synced block ${height}`);
      },
    );

    this.logger.verbose(`synced from ${fromHeight} to ${toHeight}`);
  }
}

const BitcoinSyncWorkerProvider = {
  provide: BitcoinSyncWorkerService,
  useClass: DefaultBitcoinSyncWorkerService,
};

export default BitcoinSyncWorkerProvider;
