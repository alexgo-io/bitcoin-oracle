import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { ApiClient } from '@meta-protocols-oracle/api-client';
import { getCurrentBitcoinHeader } from '@meta-protocols-oracle/bitcoin';
import { ValidatorProcessInterface } from '@meta-protocols-oracle/validator';
import { Inject, Logger } from '@nestjs/common';
import {
  combineLatest,
  concatMap,
  exhaustMap,
  interval,
  map,
  of,
  range,
  tap,
} from 'rxjs';
import { env } from '../env';
import { ValidatorService } from './validator.interface';

export class DefaultValidatorService implements ValidatorService {
  private readonly logger = new Logger(DefaultValidatorService.name);
  private readonly api = new ApiClient(env().INDEXER_API_URL);
  constructor(
    @Inject(ValidatorProcessInterface)
    private readonly processor: ValidatorProcessInterface,
  ) {}
  async getFromBlockHeight() {
    const latestBlocks = await this.api
      .indexer()
      .latest_block_number()
      .get({ type: env().VALIDATOR_NAME });
    // this.logger.debug(`got: ${JSON.stringify(latestBlocks)}`);

    return latestBlocks.latest_block_number
      ? latestBlocks.latest_block_number -
          env().VALIDATOR_STARTING_SYNC_BACK_BLOCK_HEIGHT
      : env().VALIDATOR_GENESIS_BLOCK_HEIGHT;
  }
  async getToBlockHeight() {
    const height =
      (await getCurrentBitcoinHeader()).height -
      env().INDEXER_SYNC_THRESHOLD_BLOCK;
    OTLP_Validator().counter['get-current-bitcoin-header'].add(1);
    // this.logger.debug(`got current bitcoin header height: ${height}`);
    return height;
  }

  syncBlockHeight(from: number, to: number) {
    return range(from, to - from + 1).pipe(
      concatMap(height => this.processor.processBlock$(height)),
      tap(() => OTLP_Validator().counter['process-block'].add(1)),
    );
  }

  startIntervalSync() {
    const syncIntervalMetric = OTLP_Validator().histogram['sync-duration'];
    let lastSync = Date.now();

    interval(env().VALIDATOR_SYNC_POLL_INTERVAL)
      .pipe(
        exhaustMap(() =>
          combineLatest([
            this.getFromBlockHeight(),
            this.getToBlockHeight(),
          ]).pipe(
            map(([fromBlockHeight, toBlockHeight]) => ({
              fromBlockHeight,
              toBlockHeight,
            })),
            concatMap(({ toBlockHeight, fromBlockHeight }) => {
              if (toBlockHeight <= fromBlockHeight) {
                return of({});
              }
              this.logger.debug(
                `- process fromBlockHeight: ${fromBlockHeight}, toBlockHeight: ${toBlockHeight}`,
              );
              return this.syncBlockHeight(fromBlockHeight, toBlockHeight);
            }),
            tap(() => {
              const now = Date.now();
              syncIntervalMetric.record(now - lastSync);
              lastSync = now;
            }),
          ),
        ),
      )
      .subscribe({
        error: err => {
          this.logger.error(`startIntervalSync error: ${err}`);
        },
      });
  }

  async start() {
    this.logger.log(
      `Starting ValidatorService - ${env().INDEXER_API_URL} - ${
        env().VALIDATOR_NAME
      }`,
    );

    const forceStart = env().VALIDATOR_FORCE_SYNC_START;
    const forceEnd = env().VALIDATOR_FORCE_SYNC_END;
    if (forceStart != null && forceEnd != null) {
      this.logger.warn(`Forcing sync from ${forceStart} to ${forceEnd}`);
      this.syncBlockHeight(forceStart, forceEnd).subscribe({
        complete: () => {
          this.logger.log(`force sync completed, ${forceStart} -> ${forceEnd}`);
          this.startIntervalSync();
        },
      });
    } else {
      this.startIntervalSync();
    }
  }
}

const ValidatorServiceProvider = {
  provide: ValidatorService,
  useClass: DefaultValidatorService,
};

export default ValidatorServiceProvider;
