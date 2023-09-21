import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      STACKS_RELAYER_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_RELAYER_ACCOUNT_SECRET: z.string().min(1),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().min(1),
      RELAYER_SYNC_POLL_INTERVAL: z.coerce.number().default(15e3),
    },
    runtimeEnv: process.env,
  }),
);
