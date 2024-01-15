import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      ENABLE_DEBUG_INFO: z.coerce.boolean().default(false),
      BRC20_ORACLE_API_CREDENTIALS: z.string().default('{}'),
      API_PORT: z.coerce.number().default(8716),
      HEARTBEAT_URL: z.string().optional(),
      DISABLE_AUTH: z.coerce.boolean().default(false),
      REDIS_URL: z.string().optional(),
      THROTTLE_LIMIT: z.coerce.number().default(100),
      THROTTLE_TTL_MS: z.coerce.number().default(60000),
    },
    runtimeEnv: process.env,
  }),
);
