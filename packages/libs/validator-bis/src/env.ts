import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      BIS_ACCESS_KEY: z.string().min(1),
      INDEXER_ACCESS_KEY: z.string().min(1),
      INDEXER_API_URL: z.string().default('http://localhost:8716'),
      STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_VALIDATOR_ACCOUNT_SECRET: z.string().min(1),
      VALIDATOR_GENESIS_BLOCK_HEIGHT: z.coerce.number(),
    },
    runtimeEnv: process.env,
  }),
);
