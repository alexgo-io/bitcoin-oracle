import { ValidatorProcessInterface } from '@bitcoin-oracle/validator';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { processBlock$ } from '../validator/validator';

@Injectable()
export class DefaultValidatorHiroService implements ValidatorProcessInterface {
  processBlock$(block: number): Observable<unknown> {
    return processBlock$(block);
  }
}

const ValidatorHiroServiceProvider = {
  provide: ValidatorProcessInterface,
  useClass: DefaultValidatorHiroService,
};

export default ValidatorHiroServiceProvider;
