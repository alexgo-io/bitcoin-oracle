import { IndexerModule } from '@bitcoin-oracle/api';
import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { IndexController } from './controllers/index.controller';
import {
  DebugIndexerController,
  IndexerController,
} from './controllers/indexer.controller';

@Module({
  imports: [IndexerModule, PinoLoggerModule],
  controllers: [IndexController, IndexerController, DebugIndexerController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
