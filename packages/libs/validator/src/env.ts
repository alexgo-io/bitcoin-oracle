import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      INDEXER_URL: z.string().default('http://localhost:8716'),
    },
    runtimeEnv: process.env,
  }),
);
