import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      HIRO_B20_API_URL: z.string().default('https://api.beta.mainnet.hiro.so'),
      INDEXER_URL: z.string().default('http://localhost:8716'),
      STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_VALIDATOR_ACCOUNT_SECRET: z.string().min(1),
      VALIDATOR_GENESIS_BLOCK_NUMBER: z.number().default(806108),
    },
    runtimeEnv: process.env,
  }),
);
