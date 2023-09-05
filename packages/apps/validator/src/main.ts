
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ValidatorModule } from "./validator-module/validator.module";
import { ValidatorService } from "./validator-module/validator.interface";
// async function main() {
//   // 5
//   // TODO: 802397, 801722: 404
//   processBlock$(802392).pipe(debug('validator')).subscribe();
// }
//


async function main() {
  const app = await NestFactory.create(ValidatorModule, {});
  const logger = app.get(Logger);
  app.useLogger(logger);

  logger.log(`Starting ValidatorService`);
  const worker = app.get(ValidatorService);
  worker.start();
}

main().catch(console.error);
