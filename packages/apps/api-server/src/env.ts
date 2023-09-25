import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ENABLE_DEBUG_INFO: z.coerce.boolean().default(false),
    ALEX_B20_API_CREDENTIALS: z.string().default('{}'),
    API_PORT: z.coerce.number().default(8716),
    HEARTBEAT_URL: z.string().optional(),
    DISABLE_AUTH: z.coerce.boolean().default(false),
  },
  runtimeEnv: process.env,
});
