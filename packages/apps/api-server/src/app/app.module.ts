import { IndexerModule } from '@bitcoin-oracle/api';
import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
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
    ThrottlerModule.forRoot({
      throttlers: [
        { limit: env().THROTTLE_LIMIT, ttl: seconds(env().THROTTLE_TTL_SEC) },
      ],
      storage:
        env().THROTTLE_REDIS_URL == null
          ? undefined
          : new ThrottlerStorageRedisService(env().THROTTLE_REDIS_URL),
    }),
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
