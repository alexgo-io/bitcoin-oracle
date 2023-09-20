import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const envTest = memoizee(() =>
  createEnv({
    server: {
      STACKS_DEPLOYER_ACCOUNT_SECRET: z.string(),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_PUPPET_URL: z.string(),
      STACKS_RELAYER_ACCOUNT_SECRET: z.string(),
      STACKS_VALIDATOR_ACCOUNT_SECRET: z.string(),
      STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string(),
    },
    runtimeEnv: process.env,
  }),
);
