import { IndexerType, ModelOf } from '@alex-b20/types';
import { Inject } from '@nestjs/common';
import { Indexer } from './indexer.interface';
import { IndexerRepository } from './indexer.repository';

export class DefaultIndexer implements Indexer {
  constructor(
    @Inject(IndexerRepository)
    private readonly indexerRepository: IndexerRepository,
  ) {}

  upsertTxWithProof(tx: ModelOf<'indexer', 'tx_with_proofs'>) {
    return this.indexerRepository.upsertTxWithProof(tx);
  }

  async getBlockByBlockHash(hash: string) {
    return await this.indexerRepository.getBlockByBlockHash(
      Buffer.from(hash, 'hex'),
    );
  }

  async getLatestBlockNumberOfProof(type: IndexerType) {
    return (await this.indexerRepository.getLatestBlockNumberOfProof(type))
      .lasted_block_number;
  }
}

const IndexerProvider = {
  provide: Indexer,
  useClass: DefaultIndexer,
};

export default IndexerProvider;
