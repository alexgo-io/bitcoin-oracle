import { ValidatorProcessInterface } from '@alex-b20/validator';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { processBlock$ } from '../validator/validator';

@Injectable()
export class DefaultValidatorHiroService implements ValidatorProcessInterface {
  processBlock$(block: number): Observable<unknown> {
    return processBlock$(block);
  }
}

const ValidatorBisServiceProvider = {
  provide: ValidatorProcessInterface,
  useClass: DefaultValidatorHiroService,
};

export default ValidatorBisServiceProvider;
