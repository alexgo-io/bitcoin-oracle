import { Enums } from '@meta-protocols-oracle/types';
import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() => {
  const isProduction = process.env['NODE_ENV'] === 'production';

  return createEnv({
    server: {
      DEBUG_INSTRUMENT: z.coerce.boolean().default(false),
      SERVICE_NAME: z.coerce.string(),
      VALIDATOR_NAME: Enums.ValidatorName.default('unknown'),
      OTLP_EXPORT_INTERVAL_MILLIS: z.coerce
        .number()
        .default(isProduction ? 60000 : 3000),
      // ref: https://opentelemetry.io/docs/concepts/sdk-configuration/otlp-exporter-configuration/
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.coerce
        .string()
        .default('http://localhost:4318/v1/traces'),
      OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: z.coerce
        .string()
        .default('http://localhost:4318/v1/metrics'),
      OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: z.coerce
        .string()
        .default('http://localhost:4318/v1/logs'),
    },
    runtimeEnv: process.env,
  });
});
