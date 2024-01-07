import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

const LogLevelSchema = z.preprocess(text => {
  if (text == null) return 'debug';
  if (text === 'verbose') return 'trace';
  if (text === 'log') return 'info';
  return text;
}, z.enum(['info', 'warn', 'error', 'debug', 'trace']));

export const env = memoizee(() =>
  createEnv({
    server: {
      LOG_LEVEL: LogLevelSchema,
      NODE_ENV: z.string().default('development'),
      STACKS_NETWORK_TYPE: z.string().optional(),
      STACKS_API_URL: z.string().optional(),
    },
    runtimeEnv: process.env,
  }),
);
