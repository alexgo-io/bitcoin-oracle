import { assertNever, getLogger } from '@meta-protocols-oracle/commons';
import memoizee from 'memoizee';
import {
  Observable,
  OperatorFunction,
  Subject,
  from,
  mergeMap,
  share,
} from 'rxjs';
import { env } from '../env';
import { getBISQueue } from '../queue';
import { BISBatchBalance } from './base';
import {
  getActivityOnBlock,
  getTokenInfo,
  safeGetBatchBalanceOnBlock,
} from './bis-api';

const getActivityOnBlockMemoized = memoizee(getActivityOnBlock, {
  promise: true,
  maxAge: 300e3,
});
export function getActivityOnBlock$(block: number) {
  return from(
    getBISQueue().add(() =>
      getActivityOnBlockMemoized(block).then(r => {
        getLogger('bis-queue').debug(
          `queue size: ${getBISQueue().size}. getActivityOnBlock`,
        );
        return r;
      }),
    ),
  );
}

const getTokenInfoMemoized = memoizee(getTokenInfo, {
  promise: true,
});

export function getTokenInfo$(token: string) {
  return from(
    getBISQueue().add(() =>
      getTokenInfoMemoized(token).then(r => {
        getLogger('bis-queue').debug(
          `queue size: ${getBISQueue().size}. getTokenInfo`,
        );
        return r;
      }),
    ),
  );
}

/*
  * Batch request
  the request is sent in batch in either of two condition:
  - queue has reach limit: queueLimit
  - passed timeWindow seconds since last request
 */
function windowTimeSize<T>(
  queueLimit: number,
  timeWindow: number,
): OperatorFunction<T, T[]> {
  return requests$ => {
    const reqQueue: T[] = [];
    const res$ = new Subject<T[]>();
    let timer: undefined | ReturnType<typeof setTimeout>;

    const emitQueue = (): void => {
      if (!reqQueue.length) return;
      res$.next(reqQueue.slice());
      reqQueue.length = 0;
    };

    requests$.subscribe({
      ...res$,
      next(req) {
        clearTimeout(timer);
        timer = setTimeout(emitQueue, timeWindow);

        reqQueue.push(req);
        if (reqQueue.length >= queueLimit) {
          emitQueue();
        }
      },
    });

    return res$;
  };
}

type BISRequestBalance = {
  pkscript: string;
  block_height: number;
  ticker: string;
};

const requestBalanceSubject = new Subject<BISRequestBalance>();
const responseBalanceResponse$ = requestBalanceSubject.pipe(
  windowTimeSize(env().BIS_BALANCE_BATCH_SIZE, 1000),
  mergeMap(requests => {
    return safeGetBatchBalanceOnBlock(requests);
  }),
  share(),
);

export function getBalanceOnBlockInBatchQueue$(
  params: BISRequestBalance,
): Observable<BISBatchBalance> {
  return new Observable(ob => {
    const subscription = responseBalanceResponse$.subscribe({
      ...ob,
      next(resAry) {
        if (resAry.type === 'success') {
          const balance = resAry.data.data.find(
            b =>
              b.pkscript === params.pkscript &&
              b.tick === params.ticker &&
              b.block_height === params.block_height,
          );
          if (balance != null) {
            ob.next(balance);
            ob.complete();
            subscription.unsubscribe();
          }
        } else if (resAry.type === 'error') {
          ob.error(resAry.error);
          subscription.unsubscribe();
        } else {
          assertNever(resAry);
        }
      },
    });

    requestBalanceSubject.next(params);
  });
}
