import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { sleep } from '@meta-protocols-oracle/commons';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { env } from './env';
import { ValidatorModule } from './validator-module/validator.module';

async function main() {
  const app = await NestFactory.create(
    ValidatorModule.withValidator(env().VALIDATOR_NAME),
    {},
  );
  const logger = app.get(Logger);
  app.useLogger(logger);

  // logger.log(`Starting ValidatorService`);
  // const worker = app.get(ValidatorService);
  // worker.start();

  for (let i = 0; i < 1000; i++) {
    logger.log(`Adding new order ${i}`);
    await sleep(1000);
    OTLP_Validator().histogram['sync-duration'].record(Math.random() * 1000);
  }
}

main().catch(console.error);
