import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { BitcoinSyncWorkerService } from './sync-module/bitcoin-sync-worker.interface';
import { BitcoinSyncWorkerModule } from './sync-module/bitcoin-sync-worker.module';

async function main() {
  const app = await NestFactory.create(BitcoinSyncWorkerModule, {});
  const logger = app.get(Logger);
  app.useLogger(logger);

  logger.log(`Starting BitcoinSyncWorkerService`);
  const worker = app.get(BitcoinSyncWorkerService);

  await worker.start();
}

main().catch(console.error);
