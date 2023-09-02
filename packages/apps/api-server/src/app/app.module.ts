import { IndexerModule } from '@alex-b20/api';
import { PinoLoggerModule } from '@alex-b20/commons';
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
