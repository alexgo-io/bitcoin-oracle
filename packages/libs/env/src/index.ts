import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import * as fs from 'fs';
import { z } from 'zod';

if (process.env['NODE_ENV'] !== 'production') {
  if (fs.existsSync('.env')) {
    config({ path: '.env' });
  } else if (fs.existsSync('../.env')) {
    config({ path: '../.env' });
  } else if (fs.existsSync('../../.env')) {
    config({ path: '../../.env' });
  } else if (fs.existsSync('../../../.env')) {
    config({ path: '../../../.env' });
  }
}

export const env = createEnv({
  server: {
    BIS_ACCESS_KEY: z.string().min(1),
    OK_ACCESS_KEY: z.string().min(1),
    FIXTURE_DIR: z.string(),
    MOCK_API: z.boolean().default(true),
    ELECTRUM_HOST: z.string().default('fortress.qtornado.com'),
    ELECTRUM_PORT: z.coerce.number().default(443),
    ELECTRUM_PROTOCOL: z.string().default('ssl'),
    STACKS_API_URL: z.string().min(1),
    STACKS_MAINNET_API_URL: z.string().default('https://stacks-node-api.mainnet.stacks.co'),
    STACKS_NETWORK_TYPE: z.enum(['mainnet', 'testnet']).default('testnet'),
    STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string().min(1),
    STACKS_VALIDATOR_ACCOUNT_SECRET: z.string().min(1),
    STACKS_RELAYER_ACCOUNT_ADDRESS: z.string().min(1),
    STACKS_RELAYER_ACCOUNT_SECRET: z.string().min(1),
  },
  runtimeEnv: process.env,
});

export const envDevelopment = {
  ...env,
  ...createEnv({
    server: {
      STACKS_DEPLOYER_ACCOUNT_SECRET: z.string().min(1),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_PUPPET_URL: z.string().min(1),
    },
    runtimeEnv: process.env,
  }),
};
