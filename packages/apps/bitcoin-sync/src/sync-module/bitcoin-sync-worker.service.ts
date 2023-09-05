import {
  calculateBlockHash,
  getBitcoinBlockHeaderByHeights,
  getCurrentBitcoinHeader,
} from '@alex-b20/bitcoin';
import { Inject, Logger } from '@nestjs/common';
import { range } from 'ramda';
import {
  combineLatest,
  exhaustMap,
  from,
  interval,
  map,
  switchMap,
} from 'rxjs';
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
    this.sync();
  }

  sync() {
    interval(env().BITCOIN_SYNC_POLL_INTERVAL)
      .pipe(
        exhaustMap(() => from(this.syncMissingBlocks())),
        exhaustMap(() =>
          combineLatest([this.getFromBlockHeight$(), this.getToBlockHeight$()]),
        ),
        switchMap(value => {
          const [fromHeight, toHeight] = value;
          return from(this.syncFrom(fromHeight, toHeight)).pipe(
            map(() => value),
          );
        }),
      )
      .subscribe();
  }

  getFromBlockHeight$() {
    return from(this.repository.latestBlock()).pipe(
      map(
        block =>
          block?.height ?? BigInt(env().BITCOIN_SYNC_GENESIS_BLOCK_HEIGHT),
      ),
      map(height => Number(height)),
    );
  }

  getToBlockHeight$() {
    return from(getCurrentBitcoinHeader()).pipe(map(block => block.height));
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
