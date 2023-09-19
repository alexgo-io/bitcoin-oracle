import {
  DTOIndexer,
  Enums,
  IndexerType,
  m,
  ModelIndexer,
} from '@alex-b20/types';
import got from 'got-cjs';

export function indexer(baseURL: string) {
  const url = `${baseURL}/api/v1/indexer`;
  return {
    txs() {
      return {
        async post(params: DTOIndexer<'txs_with_proofs'>) {
          return got
            .post(`${url}/txs`, {
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
            )
            .json<{ latest_block_number: number | null }>();
        },
      };
    },
  };
}
