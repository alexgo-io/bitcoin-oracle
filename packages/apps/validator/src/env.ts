import { Enums } from '@bitcoin-oracle/types';
import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      VALIDATOR_GENESIS_BLOCK_HEIGHT: z.coerce.number(),
      VALIDATOR_SYNC_POLL_INTERVAL: z.coerce.number().default(15e3),
      VALIDATOR_STARTING_SYNC_BACK_BLOCK_HEIGHT: z.coerce.number().default(1),
      VALIDATOR_FORCE_SYNC_START: z.coerce.number().nullish(),
      VALIDATOR_FORCE_SYNC_END: z.coerce.number().nullish(),
      INDEXER_API_URL: z.string().default('http://localhost:8716'),
      VALIDATOR_NAME: Enums.ValidatorName.default('bis'),
    },
    runtimeEnv: process.env,
  }),
);
