import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const LogLevelSchema = z.preprocess(text => {
  if (text == null) return 'debug';
  if (text === 'verbose') return 'trace';
  if (text === 'log') return 'info';
  return text;
}, z.enum(['info', 'warn', 'error', 'debug', 'trace']));

export const env = createEnv({
  server: {
    LOG_LEVEL: LogLevelSchema,
    NODE_ENV: z.string().default('development'),
  },
  runtimeEnv: process.env,
});
