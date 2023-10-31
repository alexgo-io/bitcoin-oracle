import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { ApiClient } from '@meta-protocols-oracle/api-client';
import {
  reverseBuffer,
  withElectrumClient,
} from '@meta-protocols-oracle/bitcoin';
import { bytesToHex, hexToBytes } from 'micro-stacks/common';
import { Observable, from, tap } from 'rxjs';
import { env } from '../env';
import { getElectrumQueue } from '../queue';

export async function getBitcoinTx(txId: string) {
  return withElectrumClient(async client => {
    const tx = await client.blockchain_transaction_get(txId, true);
    if (typeof tx.confirmations === 'undefined' || tx.confirmations < 1) {
      throw new Error('Tx is not confirmed');
    }

    const api = new ApiClient(env().INDEXER_API_URL);

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

export function getBitcoinTx$(txId: string): Observable<{
  tx: string;
  header: string;
  proof: { 'tx-index': number; 'tree-depth': number; hashes: string[] };
  height: string;
}> {
  return from(getElectrumQueue().add(() => getBitcoinTx(txId))).pipe(
    tap(() => {
      OTLP_Validator().counter['get-bitcoin-tx'].add(1);
    }),
  );
}
