/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ConflictingNonceStrategySchema,
  StacksRBFModeSchema,
} from '@meta-protocols-oracle/types';
import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';
const StageFeeNumberSchema = z.preprocess((val, ctx) => {
  if (typeof val !== 'string') {
    ctx.addIssue({
      code: 'invalid_type',
      received: typeof val,
      expected: 'string',
    });
    return z.NEVER;
  }
  const numbers = z.array(z.coerce.number()).parse(val.split(','));
  // check duplication
  if (numbers.length !== new Set(numbers).size) {
    ctx.addIssue({
      code: 'custom',
      message: 'Array contains duplicate values',
    });
    return z.NEVER;
  }

  // check if sorted ascending
  const sortedNumbers = [...numbers].sort();
  if (numbers.some((n, i) => n !== sortedNumbers[i])) {
    ctx.addIssue({
      code: 'custom',
      message: 'Array is not sorted ascending',
    });
    return z.NEVER;
  }

  return numbers;
}, z.array(z.number()));

export const env = memoizee(() =>
  createEnv({
    server: {
      STACKS_PUPPET_URL: z.string().optional(),
      STACKS_NETWORK_TYPE: z.string(),
      STACKS_API_URL: z.string(),
      ALERT_URL: z.string().optional(),
      STACKS_MAX_TX_PER_BLOCK: z.number().default(25),
      STACKS_RBF_STAGES: StageFeeNumberSchema.default('0.08, 0.12, 0.24, 0.48'),
      STACKS_TX_GAS_FLOOR: z.coerce.number().default(0.0005),
      STACKS_TX_GAS_CAP: z.coerce.number().default(2),
      STACKS_RBF_ESTIMATE_THRESHOLD: z.coerce.number().default(200000), // 0.2 difference for change
      STACKS_RBF_MODE: StacksRBFModeSchema,
      STACKS_CONFLICTING_NONCE_STRATEGY: ConflictingNonceStrategySchema,
      STACKS_MULTI_CAST: z.coerce.boolean().default(false),
    },
    runtimeEnv: process.env,
  }),
);

export const envTest = memoizee(() =>
  createEnv({
    server: {
      STACKS_DEPLOYER_ACCOUNT_SECRET: z.string(),
      STACKS_DEPLOYER_ACCOUNT_ADDRESS: z.string().min(1),
      STACKS_PUPPET_URL: z.string(),
      STACKS_RELAYER_ACCOUNT_ADDRESS: z.string(),
      STACKS_RELAYER_ACCOUNT_SECRET: z.string(),
      STACKS_VALIDATOR_ACCOUNT_SECRET: z.string(),
      STACKS_VALIDATOR_ACCOUNT_ADDRESS: z.string(),
    },
    runtimeEnv: process.env,
  }),
);
