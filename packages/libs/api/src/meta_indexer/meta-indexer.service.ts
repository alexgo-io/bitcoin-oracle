import { OTLP_Indexer } from '@bitcoin-oracle/instrument';
import { noAwait, sleep } from '@meta-protocols-oracle/commons';
import { Inject } from '@nestjs/common';
import PQueue from 'p-queue';
import { env } from '../env';
import { MetaIndexerService } from './meta-indexer.interface';
import { MetaIndexerRepository } from './meta-indexer.repository';

export class DefaultMetaIndexerService implements MetaIndexerService {
  private queue = new PQueue();

  constructor(
    @Inject(MetaIndexerRepository)
    private readonly metaIndexerRepository: MetaIndexerRepository,
  ) {}

  startProcess() {
    noAwait(
      this.queue.add(async () => {
        for (;;) {
          const start = Date.now();

          await this.metaIndexerRepository.process({
            size: env().META_INDEXER_SYNC_SIZE,
          });

          OTLP_Indexer().histogram['indexer-duration'].record(
            Date.now() - start,
          );

          await sleep(env().META_INDEXER_SYNC_INTERVAL_MS);
        }
      }),
    );
  }
}

const MetaIndexerServiceProvider = {
  provide: MetaIndexerService,
  useClass: DefaultMetaIndexerService,
};

export default MetaIndexerServiceProvider;
