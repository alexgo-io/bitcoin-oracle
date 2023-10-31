import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { expoRetry } from '@meta-protocols-oracle/commons';
import {
  APIOf,
  Enums,
  ModelIndexer,
  ValidatorName,
  m,
} from '@meta-protocols-oracle/types';
import got from 'got-cjs';
import memoizee from 'memoizee';
import { env } from '../env';

const headers = memoizee(() => ({
  'x-service-type': Enums.ServiceType.enum.VALIDATOR,
  'x-version': '0.0.1',
  authorization: `Bearer ${env().INDEXER_ACCESS_KEY}`,
}));

export function indexer(baseURL: string) {
  const url = `${baseURL}/api/v1/indexer`;
  return {
    txs() {
      return {
        async post(params: APIOf<'txs', 'request', 'json'>) {
          const rs = got
            .post(`${url}/txs`, {
              headers: headers(),
              json: params,
            })
            .json<APIOf<'txs', 'response', 'json'>>();

          OTLP_Validator().counter['submit-indexer-tx'].add(1);

          return rs;
        },
      };
    },
    block() {
      return {
        async get(params: { block_hash: string }) {
          return expoRetry(
            () =>
              got
                .get(`${url}/block-hash/${params.block_hash}`, {
                  headers: headers(),
                  parseJson: body =>
                    m.database('indexer', 'blocks').parse(JSON.parse(body)),
                })
                .json<ModelIndexer<'blocks'>>(),
            'get block by block-hash',
          );
        },
      };
    },
    latest_block_number() {
      return {
        async get(params: { type: ValidatorName | string }) {
          return got
            .get(
              `${url}/latest-block-number/${Enums.ValidatorName.parse(
                params.type,
              )}`,
              {
                headers: headers(),
              },
            )
            .json<{ latest_block_number: number | null }>();
        },
      };
    },
  };
}
