import { Observable } from 'rxjs';
import { withElectrumClient } from './electrum-client';
import { getBitcoinTxData } from './get-bitcoin-tx-data';

export function getBitcoinData$(txIds: string[]) {
  return new Observable(subscriber => {
    withElectrumClient(async client => {
      await Promise.all(
        txIds.map(txId =>
          getBitcoinTxData(txId, client)
            .then(data => {
              subscriber.next(data);
            })
            .catch(error => {
              subscriber.error(error);
            }),
        ),
      );

      subscriber.complete();
    }).catch(error => {
      subscriber.error(error);
    });
  });
}
