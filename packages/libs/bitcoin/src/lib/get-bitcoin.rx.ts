import { env } from '@alex-b20/env';
import ElectrumClient from 'electrum-client-sl';
import {
  from,
  mergeAll,
  mergeMap,
  Observable,
  of,
  retry,
  withLatestFrom,
} from 'rxjs';
import { getBitcoinTxData } from './get-bitcoin-tx-data';

export class ElectrumClientService {
  private client: ElectrumClient;

  constructor() {
    this.client = new ElectrumClient(
      env.ELECTRUM_HOST,
      env.ELECTRUM_PORT,
      env.ELECTRUM_PROTOCOL,
    );
  }
}

export function getElectrumClient$(): Observable<ElectrumClient> {
  return new Observable(subscriber => {
    const client = new ElectrumClient(
      env.ELECTRUM_HOST,
      env.ELECTRUM_PORT,
      env.ELECTRUM_PROTOCOL,
    );
    client.connect().then(() => {
      subscriber.next(client);
    });

    return () => {
      return client.close();
    };
  });
}

export function getBitcoinData$(txIds: string[]) {
  return getElectrumClient$().pipe(
    withLatestFrom(of(txIds).pipe(mergeAll())),
    mergeMap(([client, txId]) => {
      return from(getBitcoinTxData(txId, client));
    }, 10),
    retry(5),
  );
}
