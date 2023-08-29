import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import 'dotenv/config'

export const env = () =>
  createEnv({
    server: {
      NODE_DATABASE_URL: z.string().min(1),
    },
    runtimeEnv: process.env,
  });
