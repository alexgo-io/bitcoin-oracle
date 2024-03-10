import { BooleanSchema } from '@meta-protocols-oracle/types';
import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import process from 'process';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      ENABLE_DEBUG_INFO: BooleanSchema.default(false),
      API_PORT: z.coerce.number().default(8716),
      HEARTBEAT_URL: z.string().optional(),
      DISABLE_AUTH: BooleanSchema.default(false),
      REDISPORT: z.coerce.number().optional(),
      REDISHOST: z.string().optional(),
      THROTTLE_LIMIT: z.coerce.number().default(100),
      THROTTLE_TTL_SEC: z.coerce.number().default(60),
      JWT_SECRET: z.string().default('secret'),
    },
    runtimeEnv: process.env,
  }),
);
