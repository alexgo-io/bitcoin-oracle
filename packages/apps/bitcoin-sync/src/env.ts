import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      BITCOIN_SYNC_GENESIS_BLOCK_HEIGHT: z.coerce.number().default(700000),
      BITCOIN_SYNC_POLL_INTERVAL: z.coerce.number().default(2e3),
      SERVICE_NAME: z.coerce.string().default('bitcoin-sync-app'),
    },
    runtimeEnv: process.env,
  }),
);
