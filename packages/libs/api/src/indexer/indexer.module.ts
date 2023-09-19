import { PersistentModule } from '@alex-b20/persistent';
import { Module } from '@nestjs/common';
import { Indexer } from './indexer.interface';
import { IndexerRepository } from './indexer.repository';
import IndexerProvider from './indexer.service';

@Module({
  imports: [PersistentModule],
  providers: [IndexerRepository, IndexerProvider],
  exports: [IndexerRepository, Indexer],
})
export class IndexerModule {}
