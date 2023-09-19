import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { env } from './env';
import { ValidatorService } from './validator-module/validator.interface';
import { ValidatorModule } from './validator-module/validator.module';

async function main() {
  const app = await NestFactory.create(
    ValidatorModule.withValidator(env().INDEXER_TYPE),
    {},
  );
  const logger = app.get(Logger);
  app.useLogger(logger);

  logger.log(`Starting ValidatorService`);
  const worker = app.get(ValidatorService);
  worker.start();
}

main().catch(console.error);
