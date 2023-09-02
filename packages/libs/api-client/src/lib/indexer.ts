import {
  IndexerTxsPostResponse,
  IndexerTxsPostResponseSchema,
  IndexerTxWithProofJSON,
} from '@alex-b20/types';
import got from 'got-cjs';

export function indexer(baseURL: string) {
  return {
    txs() {
      return {
        async post(params: IndexerTxWithProofJSON) {
          return got
            .post(`${baseURL}/indexer/txs`, {
              json: params,
              parseJson: body => IndexerTxsPostResponseSchema.parse(body),
            })
            .json<IndexerTxsPostResponse>();
        },
      };
    },
  };
}
