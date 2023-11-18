import { OTLP_BitcoinSync } from '@bitcoin-oracle/instrument';
import {
  calculateBlockHash,
  getBitcoinBlockHeaderByHeights,
  getCurrentBitcoinHeader,
} from '@meta-protocols-oracle/bitcoin';
import { sleep } from '@meta-protocols-oracle/commons';
import { Inject, Logger } from '@nestjs/common';
import { range } from 'ramda';
import { env } from '../env';
import { BitcoinSyncWorkerService } from './bitcoin-sync-worker.interface';
import { BitcoinSyncWorkerRepository } from './bitcoin-sync-worker.repository';

export class DefaultBitcoinSyncWorkerService
  implements BitcoinSyncWorkerService
{
  private readonly logger = new Logger(DefaultBitcoinSyncWorkerService.name);

  private latestProcessedBlockHeight = -1;
  constructor(
    @Inject(BitcoinSyncWorkerRepository)
    private readonly repository: BitcoinSyncWorkerRepository,
  ) {
    OTLP_BitcoinSync().gauge.height.addCallback(ob => {
      ob.observe(this.latestProcessedBlockHeight);
    });
  }
  async start(): Promise<void> {
    this.logger.verbose(`starting sync`);
    await this.sync();
  }

  async sync() {
    // noinspection InfiniteLoopJS
    for (;;) {
      const start = Date.now();
      await this.syncMissingBlocks();
      const fromHeight = await this.getFromBlockHeight$();
      const toHeight = await this.getToBlockHeight$();
      await this.syncFrom(fromHeight, toHeight);

      await sleep(env().BITCOIN_SYNC_POLL_INTERVAL);

      OTLP_BitcoinSync().histogram.sync.record(Date.now() - start);
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
    this.logger.verbose(`syncing missing blocks ${missingBlocks.rows.length}`);

    await getBitcoinBlockHeaderByHeights(
      missingBlocks.rows.map(i => Number(i.missing_block)),
      async (header, height) => {
        await this.insertBlock(header, height);
      },
    );
  }

  async syncFrom(fromHeight: number, toHeight: number) {
    this.logger.verbose(`syncing from ${fromHeight} to ${toHeight}`);
    await getBitcoinBlockHeaderByHeights(
      range(fromHeight, toHeight + 1),
      async (h, height) => {
        await this.insertBlock(h, height);
      },
    );

    this.logger.verbose(`synced from ${fromHeight} to ${toHeight}`);
  }

  async insertBlock(header: string, height: number) {
    this.latestProcessedBlockHeight = height;

    const headBuf = Buffer.from(header, 'hex');
    const rows = await this.repository.upsertBlock({
      height: BigInt(height),
      header: headBuf,
      block_hash: calculateBlockHash(headBuf),
      canonical: true,
    });
    OTLP_BitcoinSync().counter.upsertBlock.add(1);

    if (rows.length > 0) {
      this.logger.log(`synced block ${height}, updated ${rows.length}`);
    }
  }
}

const BitcoinSyncWorkerProvider = {
  provide: BitcoinSyncWorkerService,
  useClass: DefaultBitcoinSyncWorkerService,
};

export default BitcoinSyncWorkerProvider;
