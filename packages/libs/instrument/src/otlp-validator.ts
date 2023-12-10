import { getLogger } from '@meta-protocols-oracle/commons';
import { ValueType } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import memoizee from 'memoizee';
import { env } from './env';

export const OTLP_Validator = memoizee(() => {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: `bitcoin-oracle-validator-${
      env().VALIDATOR_NAME
    }`,
    [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
    exportIntervalMillis: env().OTLP_EXPORT_INTERVAL_MILLIS,
  });

  const meterProvider = new MeterProvider({
    resource: resource,
  });

  meterProvider.addMetricReader(metricReader);

  const meter = meterProvider.getMeter(`validator`);
  const processNewBlockCounter = meter.createCounter(
    'validator.process-new-block',
    {
      description: `processor finish process a block, this does remove duplicated ones`,
    },
  );

  const processNewBlockAddOne = memoizee((blockNumber: number) => {
    getLogger('validator').verbose(`process nwe block ${blockNumber}`);
    processNewBlockCounter.add(1);
    return blockNumber;
  });

  const submitNewIndexerTxCounter = meter.createCounter(
    'validator.submit-new-indexer-tx',
    {
      description: `submit new tx to indexer api`,
    },
  );

  const submitNewIndexerTx = memoizee((uniqueId: string) => {
    getLogger('validator').verbose(`submit new indexer tx ${uniqueId}`);
    submitNewIndexerTxCounter.add(1);

    return uniqueId;
  });

  return {
    counter: {
      'get-current-bitcoin-header': meter.createCounter(
        'validator.get-current-bitcoin-header',
        {
          description: `get current bitcoin header from electrum client`,
        },
      ),
      'get-bitcoin-tx': meter.createCounter('validator.get-bitcoin-tx', {
        description: 'get a bitcoin tx from electrum client',
      }),
      'process-block': meter.createCounter('validator.process-block', {
        description: `processor finish process a block, this does not remove duplicated ones`,
      }),
      'process-new-block': { addOne: processNewBlockAddOne },
      'submit-new-indexer-tx': { addOne: submitNewIndexerTx },
      'submit-indexer-tx': meter.createCounter('validator.submit-indexer-tx', {
        description: `submit tx to indexer api`,
      }),
      'get-data-on-block': meter.createCounter('validator.get-data-on-block', {
        description: `get all data needed on block from validator api, including activity, balances`,
      }),
      'get-activity-on-block': meter.createCounter(
        'validator.get-activity-on-block',
        {
          description: `get activity on block from validator api, it can be called multiple times if pagination is needed`,
        },
      ),
      'get-balance-on-block': meter.createCounter(
        'validator.get-balance-on-block',
        {
          description: `get balance of a address on block from validator api, it can be called multiple times if pagination is needed`,
        },
      ),
      'get-batch-balance-on-block': meter.createCounter(
        'validator.get-batch-balance-on-block',
        {
          description: `get balance of multiple addresses on block from validator api`,
        },
      ),

      'get-token-info': meter.createCounter('validator.get-token-info', {
        description: `get token info from validator api`,
      }),
    },
    histogram: {
      'sync-duration': meter.createHistogram('validator.sync-duration', {
        description: `the time to take to run sync once in a loop`,
        unit: 'ms',
        valueType: ValueType.INT,
      }),
    },
    gauge: {
      height: meter.createObservableGauge('validator.latest-process-height', {
        description: `the latest txs height processed by the validator`,
      }),
    },
  };
});
