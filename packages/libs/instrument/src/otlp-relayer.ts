import { ValueType } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
  ConsoleMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import memoizee from 'memoizee';
import { env } from './env';

export const OTLP_Relayer = memoizee((shard: string) => {
  const meterProvider = new MeterProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: `relayer-app-${shard}`,
    }),
  });

  meterProvider.addMetricReader(
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
      exportIntervalMillis: env().OTLP_EXPORT_INTERVAL_MILLIS,
    }),
  );

  if (env().DEBUG_INSTRUMENT) {
    meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
        exportIntervalMillis: 1000,
      }),
    );
  }

  const meter = meterProvider.getMeter(`relayer`);

  return {
    counter: {
      'error-tx-hash-too-long': meter.createCounter('error-tx-hash-too-long', {
        description: `encounter a tx hash too long error`,
      }),
      'error-mismatch': meter.createCounter('error-mismatch', {
        description: `encounter a mismatch error, validators submitted info does not match`,
      }),
      'error-server-hash-mismatch': meter.createCounter(
        'error-server-hash-mismatch',
        {
          description: `encounter a server hash mismatch error`,
        },
      ),
      'update-already-indexed': meter.createCounter('update-already-indexed', {
        description: `update a tx that is already indexed`,
      }),
      'broadcast-indexer-tx': meter.createCounter('broadcast-indexer-tx', {
        description: `broadcast a indexer tx`,
      }),
      'broadcast-indexer-tx-error': meter.createCounter(
        'broadcast-indexer-tx-error',
        {
          description: `broadcast a indexer tx failed`,
        },
      ),
      'settle-indexer-tx': meter.createCounter('settle-indexer-tx', {
        description: `a indexer tx is settled`,
      }),
    },
    histogram: {
      'relay-duration': meter.createHistogram('relay.duration', {
        description: `the time to take to relay in a loop`,
        valueType: ValueType.INT,
        unit: 'ms',
      }),
    },
  };
});
