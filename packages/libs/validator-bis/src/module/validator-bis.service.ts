import { ValidatorProcessInterface } from '@meta-protocols-oracle/validator';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { processBlock$ } from '../validator/validator';

@Injectable()
export class DefaultValidatorBisService implements ValidatorProcessInterface {
  processBlock$(block: number): Observable<unknown> {
    return processBlock$(block);
  }
}

const ValidatorBisServiceProvider = {
  provide: ValidatorProcessInterface,
  useClass: DefaultValidatorBisService,
};

export default ValidatorBisServiceProvider;
