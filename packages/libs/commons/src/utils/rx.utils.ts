/* eslint-disable @typescript-eslint/no-explicit-any */
import { concat, defer, Observable, of, switchMap, timer } from 'rxjs';

export const IntervalSignal = Symbol('IntervalSignal');

export const loopWithInterval = <T>(
  fn: () => Observable<T>,
  interval: number,
): Observable<T | typeof IntervalSignal> =>
  concat(
    fn(),
    timer(interval).pipe(switchMap(() => of(IntervalSignal))),
    defer(() => loopWithInterval(fn, interval)),
  );
