import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      DEBUG_INSTRUMENT: z.coerce.boolean().default(false),
      SERVICE_NAME: z.coerce.string(),
    },
    runtimeEnv: process.env,
  }),
);
