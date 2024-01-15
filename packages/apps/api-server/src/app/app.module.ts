import { IndexerModule } from '@bitcoin-oracle/api';
import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { env } from '../env';
import { IndexController } from './controllers/index.controller';
import {
  DebugIndexerController,
  IndexerController,
} from './controllers/indexer.controller';
import { MetaIndexerController } from './controllers/meta-indexer.controller';

@Module({
  imports: [
    IndexerModule,
    PinoLoggerModule,
    ThrottlerModule.forRoot([
      {
        ttl: env().THROTTLE_TTL_MS,
        limit: env().THROTTLE_LIMIT,
      },
    ]),
  ],
  controllers: [
    IndexController,
    IndexerController,
    DebugIndexerController,
    MetaIndexerController,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
