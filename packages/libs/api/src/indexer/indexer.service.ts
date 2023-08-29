import { IndexerTxWithProof } from '@alex-b20/types';
import { Inject } from '@nestjs/common';
import { Indexer } from './indexer.interface';
import { IndexerRepository } from './indexer.repository';

export class DefaultIndexer implements Indexer {
  constructor(
    @Inject(IndexerRepository)
    private readonly indexerRepository: IndexerRepository,
  ) {}

  upsertTxWithProof(tx: IndexerTxWithProof) {
    return this.indexerRepository.upsertTxWithProof(tx);
  }
}

const IndexerProvider = {
  provide: Indexer,
  useClass: DefaultIndexer,
};

export default IndexerProvider;
