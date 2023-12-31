import { MetaIndexerModule } from '@bitcoin-oracle/api';
import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { Module } from '@nestjs/common';

@Module({
  imports: [MetaIndexerModule, PinoLoggerModule],
})
export class IndexerWorkerModule {}
