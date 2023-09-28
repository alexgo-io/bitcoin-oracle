import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      STACKS_RELAYER_ACCOUNT_SECRET: z.string().nullish(),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().nullish(),
    },
    runtimeEnv: process.env,
  }),
);
