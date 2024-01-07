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
      RELAYER_MINIMAL_BLOCK_HEIGHT: z.coerce.number().default(1),
      RELAYER_MINIMAL_AGREEMENT_COUNT: z.coerce.number().default(2),
      RELAYER_MAXIMUM_AGREEMENT_COUNT: z.coerce.number().default(3),
      SHARD_RELAYER_INDEX: z.coerce.bigint().default(0n),
      SHARD_TOTAL_RELAYERS: z.coerce.bigint().default(1n),
      IS_WHITELIST_ENABLED: z.coerce.boolean().default(true),
      IS_WHITELIST_TXS_ENABLED: z.coerce.boolean().default(true),
    },
    runtimeEnv: process.env,
  }),
);
