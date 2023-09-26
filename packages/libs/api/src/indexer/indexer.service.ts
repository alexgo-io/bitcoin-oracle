import { APIOf, ValidatorName } from '@bitcoin-oracle/types';
import { Inject } from '@nestjs/common';
import { Indexer } from './indexer.interface';
import { IndexerRepository } from './indexer.repository';

export class DefaultIndexer implements Indexer {
  constructor(
    @Inject(IndexerRepository)
    private readonly indexerRepository: IndexerRepository,
  ) {}

  upsertTxWithProof(tx: APIOf<'txs', 'request', 'dto'>) {
    return this.indexerRepository.upsertTxWithProof(tx);
  }

  async getBlockByBlockHash(hash: string) {
    return await this.indexerRepository.getBlockByBlockHash(
      Buffer.from(hash, 'hex'),
    );
  }

  async getLatestBlockNumberOfProof(type: ValidatorName) {
    return (await this.indexerRepository.getLatestBlockNumberOfProof(type))
      .lasted_block_number;
  }

  async findDebugInfo(params: APIOf<'debug_txs', 'request', 'dto'>) {
    return await this.indexerRepository.findDebugInfo(params);
  }
}

const IndexerProvider = {
  provide: Indexer,
  useClass: DefaultIndexer,
};

export default IndexerProvider;
