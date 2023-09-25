import { IndexerModule } from '@brc20-oracle/api';
import { PinoLoggerModule } from '@brc20-oracle/commons';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { IndexController } from './controllers/index.controller';
import { IndexerController } from './controllers/indexer.controller';

@Module({
  imports: [IndexerModule, PinoLoggerModule],
  controllers: [IndexController, IndexerController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
