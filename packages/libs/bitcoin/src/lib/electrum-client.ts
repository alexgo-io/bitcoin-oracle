/* eslint-disable @typescript-eslint/no-explicit-any */
import { default as ElectrumClientSL } from 'electrum-client-sl';
import { env } from '../env';

export interface Unspent {
  height: number;
  tx_pos: number;
  tx_hash: string;
  value: number;
}

export interface Balance {
  confirmed: number;
  unconfirmed: number;
}

export interface TypedElectrumClient {
  blockchain_transaction_getMerkle(
    txid: string,
    height: number,
  ): Promise<{
    block_height: number;
    merkle: string[];
    pos: number;
  }>;

  connect(): Promise<void>;
  close(): Promise<void>;

  blockchain_block_header(
    height: number,
    cpHeight: number,
  ): Promise<{
    root: string;
    header: string;
  }>;

  blockchain_block_header(height: number): Promise<string>;
  blockchain_headers_subscribe(): Promise<{ height: number; hex: string }>;
  blockchain_transaction_get(
    txid: string,
    verbose: true,
  ): Promise<{
    locktime: number;
    txid: string;
    hash: string;
    version: number;
    size: number;
    hex: string;
    blockhash: string;
    confirmations: number;
    vin: {
      txid: string;
      vout: number;
      scriptSig: any;
      sequence: number;
    }[];
    vout: {
      value: number;
      n: number;
      scriptPubKey: {
        asm: string;
        hex: string;
        reqSigs: number;
        type: 'scripthash';
        addresses: string[];
        address: string;
      };
    }[];
  }>;
  blockchain_transaction_get(txid: string, verbose?: false): Promise<string>;

  blockchain_scripthash_listunspent(scriptHash: string): Promise<Unspent[]>;

  blockchain_transaction_broadcast(txHex: string): Promise<string>;

  blockchain_scripthash_getBalance(scriptHash: string): Promise<Balance>;
}

export async function withElectrumClient<T = void>(
  cb: (client: TypedElectrumClient) => Promise<T>,
): Promise<T> {
  const client = new ElectrumClientSL(
    env.ELECTRUM_HOST,
    env.ELECTRUM_PORT,
    env.ELECTRUM_PROTOCOL,
  );
  await client.connect();

  try {
    const res = await cb(client as unknown as TypedElectrumClient);
    await client.close();
    return res;
  } catch (error) {
    console.error(`Error from withElectrumClient`, error);
    await client.close();
    throw error;
  }
}

export function createElectrumClient(): TypedElectrumClient {
  return new ElectrumClientSL(
    env.ELECTRUM_HOST,
    env.ELECTRUM_PORT,
    env.ELECTRUM_PROTOCOL,
  ) as unknown as TypedElectrumClient;
}
