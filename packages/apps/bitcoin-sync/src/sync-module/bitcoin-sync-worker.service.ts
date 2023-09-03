import {
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
    interval(env.BITCOIN_SYNC_POLL_INTERVAL)
      .pipe(
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
        block => block?.height ?? BigInt(env.BITCOIN_SYNC_GENESIS_BLOCK_HEIGHT),
      ),
      map(height => Number(height)),
    );
  }

  getToBlockHeight$() {
    return from(getCurrentBitcoinHeader()).pipe(map(block => block.height));
  }

  async syncFrom(fromHeight: number, toHeight: number) {
    this.logger.verbose(`syncing from ${fromHeight} to ${toHeight}`);
    const headers = await getBitcoinBlockHeaderByHeights(
      range(fromHeight, toHeight),
    );

    await Promise.all(
      headers.map(header => {
        return this.repository.upsertBlock({
          height: BigInt(header.height),
          header: Buffer.from(header.header, 'hex'),
          canonical: true,
        });
      }),
    );

    this.logger.verbose(
      `synced ${headers.length} blocks, from ${fromHeight} to ${toHeight}`,
    );
  }
}

const BitcoinSyncWorkerProvider = {
  provide: BitcoinSyncWorkerService,
  useClass: DefaultBitcoinSyncWorkerService,
};

export default BitcoinSyncWorkerProvider;
