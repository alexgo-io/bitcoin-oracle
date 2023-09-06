import { ApiClient } from '@alex-b20/api-client';
import { getCurrentBitcoinHeader } from '@alex-b20/bitcoin';
import { noAwait, sleep } from '@alex-b20/commons';
import { processBlock$ } from '@alex-b20/validator-bis';
import { Logger } from '@nestjs/common';
import PQueue from 'p-queue';
import { range } from 'ramda';
import { firstValueFrom, retry, tap } from "rxjs";
import { env } from '../env';
import { ValidatorService } from './validator.interface';

export class DefaultValidatorService implements ValidatorService {
  private readonly logger = new Logger(DefaultValidatorService.name);
  constructor(private readonly api = new ApiClient(env().INDEXER_URL)) {}
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

  async start() {
    this.logger.log(`Starting ValidatorService: ${process.env['LOG_LEVEL']}`);

    const queue = new PQueue({ concurrency: 5 });
    // noinspection InfiniteLoopJS
    for (;;) {
      const fromBlockHeight = await this.getFromBlockHeight();
      const toBlockHeight = await this.getToBlockHeight$();
      this.logger.debug(
        `- process fromBlockHeight: ${fromBlockHeight}, toBlockHeight: ${toBlockHeight}`,
      );
      range(fromBlockHeight, toBlockHeight).map(height => {
        noAwait(
          queue.add(async () => {
            this.logger.debug(`| processing block ${height}`);
            await firstValueFrom(
              processBlock$(height).pipe(
                retry(5),
                tap({
                  error: error => {
                    this.logger.error(`processBlock$ error: ${error}`);
                  },
                }),
              ),
              { defaultValue: null },
            );
            this.logger.log(`+ processed block ${height}`);
          }),
        );
      });

      await queue.onIdle();
      await sleep(env().VALIDATOR_SYNC_POLL_INTERVAL);
    }
  }
}

const ValidatorServiceProvider = {
  provide: ValidatorService,
  useClass: DefaultValidatorService,
};

export default ValidatorServiceProvider;
