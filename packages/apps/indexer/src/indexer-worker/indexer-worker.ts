import { MetaIndexerModule } from '@bitcoin-oracle/api';
import { Module } from '@nestjs/common';

@Module({
  imports: [MetaIndexerModule],
})
export class IndexerWorkerModule {}
