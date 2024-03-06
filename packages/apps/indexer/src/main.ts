import { MetaIndexerService } from '@meta-protocols-oracle/api';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import process from 'process';
import { IndexerWorkerModule } from './indexer-worker/indexer-worker';

async function main() {
  const app = await NestFactory.createMicroservice(IndexerWorkerModule, {});
  const logger = app.get(Logger);
  app.useLogger(logger);

  const svc = app.get(MetaIndexerService);
  svc.startProcess();

  process.on('SIGTERM', async () => {
    // for nx serve reloading
    logger.log(`stopping indexer worker`);
    await app.close();
    process.exit(0);
  });
}

main().catch(console.error);
