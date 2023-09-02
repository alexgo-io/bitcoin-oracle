import {
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
  };
}
