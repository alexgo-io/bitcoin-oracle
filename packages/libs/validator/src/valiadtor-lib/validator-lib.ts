import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { ApiClientService } from '@meta-protocols-oracle/api';
import {
  reverseBuffer,
  withElectrumClient,
} from '@meta-protocols-oracle/bitcoin';
import { bytesToHex, hexToBytes } from 'micro-stacks/common';
import { Observable, from, tap } from 'rxjs';
import { getElectrumQueue } from '../queue';

export async function getBitcoinTx(txId: string, api: ApiClientService) {
  return withElectrumClient(async client => {
    const tx = await client.blockchain_transaction_get(txId, true);
    if (typeof tx.confirmations === 'undefined' || tx.confirmations < 1) {
      throw new Error('Tx is not confirmed');
    }

    const bitcoinBlockHeight = await api
      .indexer()
      .block()
      .get({ block_hash: tx.blockhash });

    const merkle = await client.blockchain_transaction_getMerkle(
      txId,
      Number(bitcoinBlockHeight.height),
    );
    const merkleHashes = merkle.merkle.map((hash: string) => {
      return reverseBuffer(hexToBytes(hash));
    });

    const proofArg = {
      hashes: merkleHashes,
      txIndex: merkle.pos,
      treeDepth: merkleHashes.length,
    };

    const hashes = proofArg.hashes.map(h => bytesToHex(h));

    return {
      tx: tx.hex,
      header: bitcoinBlockHeight.header.toString('hex'),
      height: bitcoinBlockHeight.height.toString(),
      proof: {
        'tx-index': proofArg.txIndex,
        hashes,
        'tree-depth': proofArg.treeDepth,
      },
    };
  });
}

export function getBitcoinTx$(
  txId: string,
  api: ApiClientService,
): Observable<{
  tx: string;
  header: string;
  proof: { 'tx-index': number; 'tree-depth': number; hashes: string[] };
  height: string;
}> {
  return from(getElectrumQueue().add(() => getBitcoinTx(txId, api))).pipe(
    tap(() => {
      OTLP_Validator().counter['get-bitcoin-tx'].add(1);
    }),
  );
}
