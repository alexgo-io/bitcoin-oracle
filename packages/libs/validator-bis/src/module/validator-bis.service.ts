import { ValidatorProcessInterface } from '@alex-b20/validator';
import { Observable } from 'rxjs';
import { processBlock$ } from '../validator/validator';

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
