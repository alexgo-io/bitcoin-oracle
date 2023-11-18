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
      [SemanticResourceAttributes.SERVICE_NAME]: `bitcoin-oracle-relayer-${shard}`,
      [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
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
    gauge: {
      height: meter.createObservableGauge('relayer.broadcast-tx-height', {
        description: `the latest txs height broadcast by the relayer`,
      }),
    },
    counter: {
      'error-tx-hash-too-long': meter.createCounter(
        'relayer.error.tx-hash-too-long',
        {
          description: `encounter a tx hash too long error`,
        },
      ),
      'error-mismatch': meter.createCounter('relayer.error.hash-mismatch', {
        description: `encounter a mismatch error, validators submitted info does not match`,
      }),
      'error-server-hash-mismatch': meter.createCounter(
        'relayer.error.server-hash-mismatch',
        {
          description: `encounter a server hash mismatch error`,
        },
      ),
      'update-already-indexed': meter.createCounter(
        'relayer.update-already-indexed',
        {
          description: `update a tx that is already indexed`,
        },
      ),
      'package-transfer': meter.createCounter('relayer.package-transfer', {
        description: `relayer package a transfer into a bundle to submit to indexer`,
      }),
      'broadcast-indexer-tx': meter.createCounter(
        'relayer.broadcast-indexer-tx',
        {
          description: `broadcast a indexer tx`,
        },
      ),
      'broadcast-indexer-tx-error': meter.createCounter(
        'relayer.error.broadcast-indexer-tx',
        {
          description: `broadcast a indexer tx failed`,
        },
      ),
      'settle-indexer-tx': meter.createCounter('relayer.settle-indexer-tx', {
        description: `a indexer tx is settled`,
      }),
      'did-RBF-broadcast': meter.createCounter('relayer.did-RBF-broadcast', {
        description: `a tx is RBF`,
      }),
    },
    histogram: {
      'relay-duration': meter.createHistogram('relayer.relay-duration', {
        description: `the time to take to relay in a loop`,
        valueType: ValueType.INT,
        unit: 'ms',
      }),
    },
  };
});
