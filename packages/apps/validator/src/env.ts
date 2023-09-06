import { IndexerTypeSchema } from '@alex-b20/types';
import { createEnv } from '@t3-oss/env-core';
import { memoizeWith } from 'ramda';
import { z } from 'zod';

export const env = memoizeWith(String, () =>
  createEnv({
    server: {
      VALIDATOR_GENESIS_BLOCK_HEIGHT: z.coerce.number().default(800600),
      VALIDATOR_SYNC_POLL_INTERVAL: z.coerce.number().default(2e3),
      VALIDATOR_STARTING_SYNC_BACK_BLOCK_HEIGHT: z.coerce.number().default(1),
      INDEXER_URL: z.string().default('http://localhost:8716'),
      INDEXER_TYPE: IndexerTypeSchema.default('bis'),
    },
    runtimeEnv: process.env,
  }),
);
