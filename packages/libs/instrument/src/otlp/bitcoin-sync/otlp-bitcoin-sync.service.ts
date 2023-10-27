import { Histogram, Meter, ValueType } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
  ConsoleMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { env } from '../../env';
import { OtlpBitcoinSyncService } from './otlp-bitcoin-sync.interface';

export class DefaultOtlpBitcoinSyncService implements OtlpBitcoinSyncService {
  metricExporter = new OTLPMetricExporter({});

  meterProvider: MeterProvider;

  meter: Meter;
  syncHistogram: Histogram;

  constructor() {
    this.meterProvider = new MeterProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: env().SERVICE_NAME,
      }),
    });

    this.meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({
        exporter: this.metricExporter,
        exportIntervalMillis: 1000,
      }),
    );

    if (env().DEBUG_INSTRUMENT) {
      this.meterProvider.addMetricReader(
        new PeriodicExportingMetricReader({
          exporter: new ConsoleMetricExporter(),
          exportIntervalMillis: 1000,
        }),
      );
    }

    this.meter = this.meterProvider.getMeter('bitcoin-sync-app');

    this.syncHistogram = this.meter.createHistogram('sync', {
      description: 'Sync',
      valueType: ValueType.INT,
    });
  }

  recordBitcoinSyncInsertBlock(
    syncDuration: number,
    { height }: { height: number },
  ) {
    this.syncHistogram.record(syncDuration, { height });
  }
}

const OtlpBitcoinSyncServiceProvider = {
  provide: OtlpBitcoinSyncService,
  useClass: DefaultOtlpBitcoinSyncService,
};

export default OtlpBitcoinSyncServiceProvider;
