/* eslint-disable @typescript-eslint/no-explicit-any */
import { StacksMainnet, StacksMocknet } from '@stacks/network';
import { ChainID, TransactionVersion } from '@stacks/transactions';
import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { env } from '../env';

export function isStacksAddressEqual(
  address1: string,
  address2: string,
): boolean {
  return address1.toLowerCase() === address2.toLowerCase();
}

export function uint8ArrayToBuffer(u: Uint8Array): Buffer {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return toBuffer(String.fromCharCode.apply(null, u));
}

export function uint8ArrayToHex(u: Uint8Array): string {
  return uint8ArrayToBuffer(u).toString('hex');
}

export function toBuffer(input: string) {
  if (input.startsWith('ST') || input.startsWith('SP')) {
    // for stacks address, we encoding it with uft8 buffer
    return Buffer.from(input);
  }

  return Buffer.from(
    input.length >= 2 && input[1] === 'x' ? input.slice(2) : input,
    'hex',
  );
}

export function sha256(data: Uint8Array): Buffer {
  return createHash('sha256').update(data).digest();
}

export function assertNever(x: never): never {
  throw new Error('Unexpected never: ' + x);
}

export function getEnvStacksChainID() {
  if (env().STACKS_NETWORK_TYPE === 'mainnet') {
    return ChainID.Mainnet;
  } else if (env().STACKS_NETWORK_TYPE === 'testnet') {
    return ChainID.Testnet;
  } else {
    throw new Error(`Unknown network type: ${env().STACKS_NETWORK_TYPE}`);
  }
}

export function getEnvStacksNetwork() {
  const chainId = getEnvStacksChainID();
  if (chainId === ChainID.Mainnet) {
    return new StacksMainnet({
      url: env().STACKS_API_URL,
      fetchFn: fetch as any,
    });
  } else if (chainId === ChainID.Testnet) {
    return new StacksMocknet({
      url: env().STACKS_API_URL,
      fetchFn: fetch as any,
    });
  } else {
    throw new Error(`Unknown network type: ${env().STACKS_NETWORK_TYPE}`);
  }
}

export function getEnvStacksTransactionVersion() {
  if (env().STACKS_NETWORK_TYPE === 'mainnet') {
    return TransactionVersion.Mainnet;
  } else if (env().STACKS_NETWORK_TYPE === 'testnet') {
    return TransactionVersion.Testnet;
  } else {
    throw new Error(`Unknown network type: ${env().STACKS_NETWORK_TYPE}`);
  }
}
