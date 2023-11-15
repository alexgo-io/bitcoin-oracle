/* eslint-disable @typescript-eslint/no-explicit-any */
import { concat, defer, EMPTY, Observable, switchMap, timer } from 'rxjs';

export const loopWithInterval = <T>(
  fn: () => Observable<T>,
  interval: number,
): Observable<T> =>
  concat(
    fn(),
    timer(interval).pipe(switchMap(() => EMPTY)),
    defer(() => loopWithInterval(fn, interval)),
  );
