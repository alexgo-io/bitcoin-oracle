import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      NODE_DATABASE_URL: z.string().min(1),
    },
    runtimeEnv: process.env,
  }),
);
