import { PersistentModule } from '@meta-protocols-oracle/persistent';
import { Module } from '@nestjs/common';
import { MetaIndexerRepository } from './meta-indexer.repository';
import MetaIndexerServiceProvider from './meta-indexer.service';

@Module({
  imports: [PersistentModule],
  providers: [MetaIndexerServiceProvider, MetaIndexerRepository],
  exports: [MetaIndexerServiceProvider],
})
export class MetaIndexerModule {}
