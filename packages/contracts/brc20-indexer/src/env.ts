import { StacksMainnet, StacksMocknet } from '@stacks/network';
import { ChainID, TransactionVersion } from '@stacks/transactions';
import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      STACKS_PUPPET_URL: z.string().optional(),
      STACKS_NETWORK_TYPE: z.string().default('testnet'),
      STACKS_API_URL: z.string(),
    },
    runtimeEnv: process.env,
  }),
);
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
    return new StacksMainnet({ url: env().STACKS_API_URL });
  } else if (chainId === ChainID.Testnet) {
    return new StacksMocknet({ url: env().STACKS_API_URL });
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
