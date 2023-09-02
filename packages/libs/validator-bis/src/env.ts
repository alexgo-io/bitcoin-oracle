import { createEnv } from '@t3-oss/env-core';
import 'dotenv/config';
import { memoizeWith } from 'ramda';
import { z } from 'zod';

export const env = memoizeWith(String, () =>
  createEnv({
    server: {
      BIS_ACCESS_KEY: z.string().min(1),
      INDEXER_URL: z.string().default('http://localhost:8716'),
      STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_VALIDATOR_ACCOUNT_SECRET: z.string().min(1),
    },
    runtimeEnv: process.env,
  }),
);
