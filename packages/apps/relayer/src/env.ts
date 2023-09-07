import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import memoizee from "memoizee";

export const env = memoizee(() =>
  createEnv({
    server: {
      STACKS_RELAYER_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_RELAYER_ACCOUNT_SECRET: z.string().min(1),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().min(1),
    },
    runtimeEnv: process.env,
  }),
);
