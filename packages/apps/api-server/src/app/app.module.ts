import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { IndexController } from './controllers/index.controller';
import { IndexerController } from './controllers/indexer.controller';
import {IndexerModule} from "@alex-b20/api";

@Module({
  imports: [IndexerModule],
  controllers: [IndexController, IndexerController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
