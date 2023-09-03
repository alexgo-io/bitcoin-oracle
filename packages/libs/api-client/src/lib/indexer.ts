import {
  IndexerBlock,
  IndexerBlockSchema,
  IndexerTxsPostResponse,
  IndexerTxsPostResponseSchema,
  IndexerTxWithProofJSON,
} from '@alex-b20/types';
import got from 'got-cjs';

export function indexer(baseURL: string) {
  const url = `${baseURL}/api/v1/indexer`;
  return {
    txs() {
      return {
        async post(params: IndexerTxWithProofJSON) {
          return got
            .post(`${url}/txs`, {
              json: params,
              parseJson: body =>
                IndexerTxsPostResponseSchema.parse(JSON.parse(body)),
            })
            .json<IndexerTxsPostResponse>();
        },
      };
    },
    block() {
      return {
        async get(params: { block_hash: string }) {
          return got
            .get(`${url}/block-hash/${params.block_hash}`, {
              parseJson: body => IndexerBlockSchema.parse(JSON.parse(body)),
            })
            .json<IndexerBlock>();
        },
      };
    },
  };
}
