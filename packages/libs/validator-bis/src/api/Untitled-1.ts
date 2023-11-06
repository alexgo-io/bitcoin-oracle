// import { Observable, OperatorFunction, Subject, mergeMap, share } from 'rxjs';
//
// interface Request {}
// interface Response {
//   req: Request;
// }
//
// const requestSubject = new Subject<Request>();
// const response$ = requestSubject.pipe(
//   aaaaa(20, 1000),
//   mergeMap((requests: Request[]): Observable<Response[]> => {
//     return batchRequest(requests)
//       .then(res => requests.map(req => ({ req })))
//       .catch(err =>
//         requests.map(req => ({
//           isError: true,
//           error: err,
//         })),
//       );
//   }),
//   // TODO: 错误处理，我们不能让它因为某个请求失败而导致整个 observable 都被关掉
//   share(),
// );
//
// function batchRequest(request: Request[]): Promise<string | Error> {}
//
// export function sendRequest(req: Request): Observable<Response> {
//   return new Observable(ob => {
//     const subscription = response$.subscribe({
//       ...ob,
//       next(resAry) {
//         const res = resAry.find(res => res.req === req);
//         if (res != null) {
//           if (res.isError) {
//             ob.error(res.error);
//           } else {
//             ob.next(res);
//             ob.complete();
//           }
//           subscription.unsubscribe();
//         }
//       },
//     });
//
//     requestSubject.next(req);
//   });
// }
//
// function aaaaa<T>(
//   queueLimit: number,
//   timeWindow: number,
// ): OperatorFunction<T, T[]> {
//   return requests$ => {
//     const reqQueue: T[] = [];
//     const res$ = new Subject<T[]>();
//     let timer: undefined | ReturnType<typeof setTimeout>;
//
//     const emitQueue = (): void => {
//       if (!reqQueue.length) return;
//       res$.next(reqQueue.slice());
//       reqQueue.length = 0;
//     };
//
//     requests$.subscribe({
//       ...res$,
//       next(req) {
//         clearTimeout(timer);
//         timer = setTimeout(emitQueue, timeWindow);
//
//         reqQueue.push(req);
//         if (reqQueue.length >= queueLimit) {
//           emitQueue();
//         }
//       },
//     });
//
//     return res$;
//   };
// }
