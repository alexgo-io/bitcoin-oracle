import './pre-process-envs';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RelayerService } from './relayer-module/relayer.interface';
import { RelayerModule } from './relayer-module/relayer.module';

async function main() {
  const app = await NestFactory.create(RelayerModule, {});
  const logger = app.get(Logger);
  app.useLogger(logger);

  logger.log(`Starting RelayerService`);
  const service = app.get(RelayerService);
  await service.startRelayer();
}

main().catch(console.error);
