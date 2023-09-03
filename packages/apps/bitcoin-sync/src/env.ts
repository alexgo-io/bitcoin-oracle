import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    BITCOIN_SYNC_GENESIS_BLOCK_HEIGHT: z.coerce.number(),
    BITCOIN_SYNC_POLL_INTERVAL: z.coerce.number().default(2e3),
  },
  runtimeEnv: process.env,
});
