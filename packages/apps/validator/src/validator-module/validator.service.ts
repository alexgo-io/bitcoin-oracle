import { getCurrentBitcoinHeader } from '@alex-b20/bitcoin';
import { processBlock$ } from '@alex-b20/validator-bis';
import { Logger } from '@nestjs/common';
import {
  combineLatest,
  concatMap,
  exhaustMap,
  from,
  interval,
  map,
  of,
  range,
  switchMap,
  tap,
} from 'rxjs';
import { env } from '../env';
import { ValidatorService } from './validator.interface';

export class DefaultValidatorService implements ValidatorService {
  private readonly logger = new Logger(DefaultValidatorService.name);
  constructor() {}
  getFromBlockHeight$() {
    return of(env().VALIDATOR_GENESIS_BLOCK_HEIGHT);
  }
  getToBlockHeight$() {
    return from(getCurrentBitcoinHeader()).pipe(map(v => v.height));
  }

  start() {
    this.logger.log(`Starting ValidatorService: ${process.env['LOG_LEVEL']}`);
    interval(env().VALIDATOR_SYNC_POLL_INTERVAL)
      .pipe(
        exhaustMap(() =>
          combineLatest([this.getFromBlockHeight$(), this.getToBlockHeight$()]),
        ),
        concatMap(value => {
          const [fromHeight, toHeight] = value;
          return from(this.syncFrom(fromHeight, toHeight)).pipe(
            map(() => value),
          );
        }),
      )
      .subscribe();
  }

  syncFrom(fromHeight: number, toHeight: number) {
    return range(fromHeight, toHeight - fromHeight - 1).pipe(
      concatMap(height => {
        this.logger.log(`Starting to process block ${height}`);
        return processBlock$(height).pipe(
          tap(() => {
            this.logger.log(`Processed block ${height}`);
          }),
        );
      }),
    );
  }
}

const ValidatorServiceProvider = {
  provide: ValidatorService,
  useClass: DefaultValidatorService,
};

export default ValidatorServiceProvider;
