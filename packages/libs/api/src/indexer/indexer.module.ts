import { PersistentModule } from '@alex-b20/persistent';
import { Module } from '@nestjs/common';
import { IndexerRepository } from './indexer.repository';

@Module({
  imports: [PersistentModule],
  providers: [IndexerRepository],
  exports: [IndexerRepository],
})
export class IndexerModule {}
