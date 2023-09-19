import { Observable } from 'rxjs';

export abstract class ValidatorProcessInterface {
  abstract processBlock$(block: number): Observable<unknown>;
}
