import { IndexerModule } from '@bitcoin-oracle/api';
import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { ZodValidationPipe } from 'nestjs-zod';
import { env } from '../env';
import { AuthModule } from './auth';
import { IndexController } from './controllers/index.controller';
import {
  DebugIndexerController,
  IndexerController,
} from './controllers/indexer.controller';
import { MetaIndexerController } from './controllers/meta-indexer.controller';

function getStorage() {
  const host = env().REDISHOST;
  const port = env().REDISPORT;
  if (host == null || port == null) {
    return undefined;
  }

  return new ThrottlerStorageRedisService(`redis://${host}:${port}`);
}

@Module({
  imports: [
    IndexerModule,
    PinoLoggerModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { limit: env().THROTTLE_LIMIT, ttl: seconds(env().THROTTLE_TTL_SEC) },
      ],
      storage: getStorage(),
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
