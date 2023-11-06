import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ELECTRUM_HOST: z.string().default('fortress.qtornado.com'),
    ELECTRUM_PORT: z.coerce.number().default(443),
    ELECTRUM_PROTOCOL: z.string().default('ssl'),
    STACKS_API_URL: z.string().min(1),
    STACKS_MAINNET_API_URL: z
      .string()
      .default('https://stacks-node-api.mainnet.stacks.co'),
  },
  runtimeEnv: process.env,
});
