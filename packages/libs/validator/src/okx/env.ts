import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

// for testing purpose
export const env = memoizee(() =>
  createEnv({
    server: {
      OK_ACCESS_KEY: z.string(),
    },
    runtimeEnv: process.env,
  }),
);
