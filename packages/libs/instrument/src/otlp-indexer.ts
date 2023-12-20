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

export const OTLP_Indexer = memoizee(() => {
  const meterProvider = new MeterProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: `bitcoin-oracle-indexer`,
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

  const meter = meterProvider.getMeter(`indexer`);

  return {
    gauge: {
      'last-height': meter.createObservableGauge('indexer.last-height', {
        description: `the latest txs height indexed by indexer`,
      }),
    },
    counter: {
      'insert-validated-tx': meter.createCounter(
        'indexer.insert-validated-tx',
        {
          description: `indexer insert a validated tx into db`,
        },
      ),
      'insert-validated-proof': memoizee((type: string) => {
        return meter.createCounter(`indexer.insert-validated-proof.${type}`, {
          description: `indexer insert a validated proof into db`,
        });
      }),
    },
    histogram: {
      'indexer-duration': meter.createHistogram('indexer.indexing-duration', {
        description: `the time to take to index in a loop`,
        valueType: ValueType.INT,
        unit: 'ms',
      }),
    },
  };
});
