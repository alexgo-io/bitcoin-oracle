import { ApiClient } from '@alex-b20/api-client';
import { getCurrentBitcoinHeader } from '@alex-b20/bitcoin';
import { ValidatorProcessInterface } from '@alex-b20/validator';
import { Inject, Logger } from '@nestjs/common';
import { concatMap, exhaustMap, from, interval, map, range } from 'rxjs';
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
      .get({ type: env().INDEXER_TYPE });
    this.logger.warn(`got: ${JSON.stringify(latestBlocks)}`);

    return latestBlocks.latest_block_number
      ? latestBlocks.latest_block_number -
          env().VALIDATOR_STARTING_SYNC_BACK_BLOCK_HEIGHT
      : env().VALIDATOR_GENESIS_BLOCK_HEIGHT;
  }
  async getToBlockHeight$() {
    return (await getCurrentBitcoinHeader()).height;
  }

  syncBlockHeight(from: number, to: number) {
    // if (to - from > 1000 || to - from < 0) {
    //   throw new Error(`invalid from/to: ${from}/${to}`);
    // }
    return range(from, to).pipe(
      concatMap(height => this.processor.processBlock$(height)),
    );
  }

  startIntervalSync() {
    interval(env().VALIDATOR_SYNC_POLL_INTERVAL)
      .pipe(
        exhaustMap(() => this.getToBlockHeight$()),
        concatMap(toBlockHeight => {
          return from(this.getFromBlockHeight()).pipe(
            map(fromBlockHeight => {
              return {
                fromBlockHeight,
                toBlockHeight,
              };
            }),
          );
        }),
        concatMap(({ toBlockHeight, fromBlockHeight }) => {
          this.logger.debug(
            `- process fromBlockHeight: ${fromBlockHeight}, toBlockHeight: ${toBlockHeight}`,
          );
          return this.syncBlockHeight(fromBlockHeight, toBlockHeight);
        }),
      )
      .subscribe();
  }

  async start() {
    this.logger.log(
      `Starting ValidatorService - ${env().INDEXER_API_URL} - ${
        env().INDEXER_TYPE
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
