import { StacksMainnet, StacksMocknet } from '@stacks/network';
import { ChainID, TransactionVersion } from '@stacks/transactions';
import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      STACKS_PUPPET_URL: z.string().optional(),
      STACKS_NETWORK_TYPE: z.string(),
      STACKS_API_URL: z.string(),
      ALERT_URL: z.string().optional(),
      STACKS_MAX_TX_PER_BLOCK: z.number().default(25),
    },
    runtimeEnv: process.env,
  }),
);

export const envTest = memoizee(() =>
  createEnv({
    server: {
      STACKS_DEPLOYER_ACCOUNT_SECRET: z.string(),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_PUPPET_URL: z.string(),
      STACKS_RELAYER_ACCOUNT_ADDRESS: z.string(),
      STACKS_RELAYER_ACCOUNT_SECRET: z.string(),
      STACKS_VALIDATOR_ACCOUNT_SECRET: z.string(),
      STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string(),
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
