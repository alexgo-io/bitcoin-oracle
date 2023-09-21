import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';

export const env = memoizee(() =>
  createEnv({
    server: {},
    runtimeEnv: process.env,
  }),
);
