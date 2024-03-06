import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import { expoRetry, getLogger } from '@meta-protocols-oracle/commons';
import {
  APIOf,
  Enums,
  ModelIndexer,
  ValidatorName,
  m,
} from '@meta-protocols-oracle/types';
import got, { RequestError } from 'got-cjs';
import memoizee from 'memoizee';
import { join } from 'path';
import { env } from '../env';

const headers = memoizee(() => ({
  'x-service-type': Enums.ServiceType.enum.VALIDATOR,
  'x-version': '0.0.1',
  authorization: `Bearer ${env().INDEXER_ACCESS_KEY}`,
}));

export class ApiClient {
  constructor(public readonly baseURL: string) {}
  indexer() {
    const url = `${this.baseURL}/api/v1/indexer`;
    return {
      txs() {
        return {
          async post(params: APIOf<'txs', 'request', 'json'>) {
            try {
              const rs = await got
                .post(`${url}/txs`, {
                  headers: headers(),
                  json: params,
                  retry: {
                    limit: 5,
                  },
                })
                .json<APIOf<'txs', 'response', 'json'>>();

              const uniqueId = `${params.order_hash}-${params.signature}`;
              OTLP_Validator().counter['submit-new-indexer-tx'].addOne(
                uniqueId,
              );
              OTLP_Validator().counter['submit-indexer-tx'].add(1);

              return rs;
            } catch (e) {
              if (e instanceof RequestError) {
                // failed to submit tx if status is 400 (INVALID_ARGUMENT)
                // it will not throw
                if (e.response?.statusCode === 400) {
                  getLogger('indexer.txs.post').error(
                    `submit tx [${JSON.stringify(params)}] failed: ${
                      e.response.body
                    }`,
                  );

                  return { message: 'failed' };
                }
                throw e;
              } else {
                throw e;
              }
            }
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
      latest_block_number_range() {
        return {
          async get(params: {
            type: ValidatorName | string;
            from: number;
            to: number;
          }) {
            return got
              .get(
                `${url}/latest-block-number-range/${Enums.ValidatorName.parse(
                  params.type,
                )}?from=${params.from}&to=${params.to}`,
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

  auth() {
    const url = join(this.baseURL, '/api/v1/auth');
    return {
      signIn: (params: {
        role_name: string;
        secret_id_accessor: string;
      }): Promise<{
        access_token: string;
      }> => {
        return got
          .post(join(url, 'login'), {
            json: params,
            responseType: 'json',
          })
          .json<{ access_token: string }>();
      },
    };
  }
}
