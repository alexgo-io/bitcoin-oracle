import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import memoizee from "memoizee";

export const env = memoizee(() =>
  createEnv({
    server: {
      NODE_DATABASE_URL: z.string().min(1),
    },
    runtimeEnv: process.env,
  }));
