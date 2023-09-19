import {
  DTOIndexer,
  Enums,
  IndexerType,
  m,
  ModelIndexer,
} from '@alex-b20/types';
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
        async post(params: DTOIndexer<'txs_with_proofs'>) {
          return got
            .post(`${url}/txs`, {
              headers: headers(),
              json: params,
              parseJson: body =>
                m.json('indexer', 'txs_with_proofs').parse(JSON.parse(body)),
            })
            .json<DTOIndexer<'txs_post_response'>>();
        },
      };
    },
    block() {
      return {
        async get(params: { block_hash: string }) {
          return got
            .get(`${url}/block-hash/${params.block_hash}`, {
              headers: headers(),
              parseJson: body =>
                m.database('indexer', 'blocks').parse(JSON.parse(body)),
            })
            .json<ModelIndexer<'blocks'>>();
        },
      };
    },
    latest_block_number() {
      return {
        async get(params: { type: IndexerType | string }) {
          return got
            .get(
              `${url}/latest-block-number/${Enums.IndexerType.parse(
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
