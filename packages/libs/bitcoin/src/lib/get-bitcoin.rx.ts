import { Observable } from 'rxjs';
import { withElectrumClient } from './electrum-client';
import { BitcoinTxDataType, getBitcoinTxDataWithStacks } from './get-bitcoin-tx-data-with-stacks';

export function getBitcoinData$(txIds: string[]) {
  return new Observable<BitcoinTxDataType>(subscriber => {
    withElectrumClient(async client => {
      await Promise.all(
        txIds.map(txId =>
          getBitcoinTxDataWithStacks(txId, client)
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
