import { StacksNetwork } from '@stacks/network';
import {
  broadcastTransaction,
  ChainID,
  StacksTransaction,
} from '@stacks/transactions';
import { random } from 'lodash';
import pino from 'pino';
import {
  asyncScheduler,
  concatMap,
  map,
  mergeMap,
  Observable,
  range,
  tap,
  timer,
} from 'rxjs';

const logger = pino();

export function keepSendingTx(
  network: StacksNetwork,
  transaction: StacksTransaction,
) {
  if (network.chainId !== ChainID.Mainnet) {
    // only want to do it for mainnet
    return;
  }

  range(0, 30)
    .pipe(
      concatMap(idx => {
        const delay = random(1e3, 1e4, false);
        return timer(delay, asyncScheduler).pipe(
          map(() => {
            return { idx, delay };
          }),
        );
      }),
      map(({ idx, delay }) => {
        return {
          networks: [
            new StacksNetwork({ url: 'https://stacks-node-api.alexlab.co/' }),
            new StacksNetwork({ url: 'https://api.hiro.so' }),
          ],
          idx,
          delay,
        };
      }),
      mergeMap(({ networks, idx, delay }) => {
        return networks.map(network => {
          return safeSendTransaction(transaction, network).pipe(
            tap(() => {
              logger.trace(
                `tx[${transaction.txid()}](${idx} +${delay}) sent again to ${
                  network.broadcastEndpoint
                }`,
              );
            }),
          );
        });
      }),
    )
    .subscribe();
}

function safeSendTransaction(
  transaction: StacksTransaction,
  network: StacksNetwork,
) {
  return new Observable<void>(observer => {
    broadcastTransaction(transaction, network)
      .then(value => {
        if (value.error) {
          logger.warn(`tx[${transaction.txid()}] - ${value.error}`);
        }
        observer.next();
        observer.complete();
      })
      .catch(err => {
        logger.warn(`tx[${transaction.txid()}] - ${err}`);
        // we don't care about the error
        observer.next();
        observer.complete();
      });
  });
}
