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
import { getBISQueue } from '../queue';
import { BISBatchBalance } from './base';
import {
  getActivityOnBlock,
  getBalanceOnBlock,
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

const getBalanceOnBlockMemoized = memoizee(getBalanceOnBlock, {
  promise: true,
  maxAge: 300e3,
});

export function getBalanceOnBlock$(address: string, block: number) {
  return from(
    getBISQueue().add(() =>
      getBalanceOnBlockMemoized(address, block).then(r => {
        getLogger('bis-queue').debug(
          `queue size: ${getBISQueue().size}. getBalanceOnBlock`,
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

type RequestBalance = {
  pkscript: string;
  block_height: number;
  ticker: string;
};

// // 20 per batch
// // 1 seconds no new request, send batch
//
// const getBalanceRelay = new ReplaySubject<RequestBalance>();
// const balancer = getBalanceRelay.asObservable().pipe(
//   timeInterval(),
//   scan(
//     (acc, curr) => {
//       const { value, interval } = curr;
//       if (interval < 1000 && acc.pendingValue.length < 20 - 1) {
//         acc.pendingValue.push(value);
//         acc.accumulatedInterval += interval;
//         return acc;
//       }
//
//       acc.accumulatedInterval = 0;
//     },
//     {
//       accumulatedInterval: 0,
//       accumulatedValue: [],
//       pendingValue: [],
//     } as {
//       accumulatedInterval: number;
//       accumulatedValue: RequestBalance[];
//       pendingValue: RequestBalance[];
//     },
//   ),
// );
//
// function getOneBalanceOnBlockInBatchAPI$(params: RequestBalance) {
//   getBalanceRelay.next(params);
//   return getBalanceRelay.pipe();
// }
//
// const queue: RequestBalance[] = [];
// let lastRequestTime: number | null = null;
//
// const resultSubject = new ReplaySubject<BISBatchBalance[]>();
// const result = resultSubject.pipe(share());
// const requestSubject = new Subject<RequestBalance[]>();
//
// requestSubject
//   .asObservable()
//   .pipe(
//     concatMap(requests => {
//       return from(getBatchBalanceOnBlock(requests)).pipe(map(d => d.data));
//     }),
//   )
//   .subscribe({
//     next(data) {
//       resultSubject.next(data);
//     },
//     error(err) {
//       resultSubject.error(err);
//     },
//   });
//
// function ofRequest(params: RequestBalance) {
//   return result.pipe(
//     map(balances => {
//       const balance = balances.find(
//         b =>
//           b.pkscript === params.pkscript &&
//           b.tick === params.ticker &&
//           b.block_height === params.block_height,
//       );
//
//       return balance;
//     }),
//   );
// }
//
// export function getBalanceOnBlockBatchMode$(params: RequestBalance) {
//   return ofRequest(params).pipe(
//     tap({
//       subscribe: () => {
//         if (
//           queue.length > 20 ||
//           (lastRequestTime && Date.now() - lastRequestTime > 1000)
//         ) {
//           const requestPrams = queue.slice();
//           queue.length = 0;
//           requestSubject.next(requestPrams);
//         } else {
//           queue.push(params);
//         }
//
//         lastRequestTime = Date.now();
//       },
//     }),
//   );
// }

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

const requestBalanceSubject = new Subject<RequestBalance>();
const responseBalanceResponse$ = requestBalanceSubject.pipe(
  windowTimeSize(20, 1000),
  mergeMap(requests => {
    return safeGetBatchBalanceOnBlock(requests);
  }),
  share(),
);

export function sendRequest(
  params: RequestBalance,
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
          ob.next(balance);
          ob.complete();
        } else if (resAry.type === 'error') {
          ob.error(resAry.error);
        } else {
          assertNever(resAry);
        }
        subscription.unsubscribe();
      },
    });

    requestBalanceSubject.next(params);
  });
}
