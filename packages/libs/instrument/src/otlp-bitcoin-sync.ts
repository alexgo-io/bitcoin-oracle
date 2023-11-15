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

export const OTLP_BitcoinSync = memoizee(() => {
  const meterProvider = new MeterProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: `bitcoin-oracle-bitcoin-sync`,
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

  const meter = meterProvider.getMeter(`bitcoin-sync`);

  return {
    counter: {
      upsertBlock: meter.createCounter('bitcoin-sync.block-upsert', {
        description: `upsert block into database, either new or update existing`,
      }),
    },
    histogram: {
      sync: meter.createHistogram('bitcoin-sync.sync-duration', {
        description: `the time to take to run sync once in a loop`,
        valueType: ValueType.INT,
        unit: 'ms',
      }),
    },
  };
});
