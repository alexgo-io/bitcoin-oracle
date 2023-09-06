import { createEnv } from '@t3-oss/env-core';
import { memoizeWith } from 'ramda';
import { z } from 'zod';

export const env = memoizeWith(String, () =>
  createEnv({
    server: {
      STACKS_RELAYER_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_RELAYER_ACCOUNT_SECRET: z.string().min(1),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().min(1),
    },
    runtimeEnv: process.env,
  }),
);
