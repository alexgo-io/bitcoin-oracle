import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      BIS_ACCESS_KEY: z.string().default(''),
      INDEXER_API_URL: z.string().default('http://localhost:8716'),
      STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_VALIDATOR_ACCOUNT_SECRET: z.string().min(1),
      VALIDATOR_GENESIS_BLOCK_HEIGHT: z.coerce.number(),
      BIS_BALANCE_BATCH_SIZE: z.coerce.number().default(100),
      BIS_RATE_PER_MINUTE: z.coerce.number().default(50),
    },
    runtimeEnv: process.env,
  }),
);
