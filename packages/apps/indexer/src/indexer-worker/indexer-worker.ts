import {
  AuthClientModule,
  MetaIndexerModule,
} from '@meta-protocols-oracle/api';
import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { Module } from '@nestjs/common';

@Module({
  imports: [MetaIndexerModule, PinoLoggerModule, AuthClientModule],
})
export class IndexerWorkerModule {}
