import { StacksMainnet, StacksMocknet } from '@stacks/network';
import { ChainID } from '@stacks/transactions';
import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string(),
      STACKS_NETWORK_TYPE: z.string(),
      STACKS_API_URL: z.string(),
      RELAYER_MINIMAL_AGREEMENT_COUNT: z.coerce.number().default(2),
      META_INDEXER_SYNC_INTERVAL_MS: z.coerce.number().default(1000),
      META_INDEXER_SYNC_SIZE: z.coerce.number().default(1000),
      VAULT_ADDR: z.string().default('http://localhost:8200'),
      VAULT_TOKEN: z.string().optional(),
      VAULT_NAMESPACE: z.string().optional(),
      INDEXER_API_URL: z.string().default('http://localhost:8716'),
      VAULT_ROLE_NAME: z.string().default('placeholder-role'),
      VAULT_ROLE_ID: z.string().default('placeholder-role-id'),
      VAULT_SECRET_ID: z.string().default('placeholder-secret-id'),
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
