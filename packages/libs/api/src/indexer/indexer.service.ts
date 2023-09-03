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

  async blockNumberOfHeader(header: string) {
    const block = await this.indexerRepository.getBlockByHeader(
      Buffer.from(header, 'hex'),
    );

    return block?.height ?? null;
  }
}

const IndexerProvider = {
  provide: Indexer,
  useClass: DefaultIndexer,
};

export default IndexerProvider;
