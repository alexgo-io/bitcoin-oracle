import { OTLP_Validator } from '@bitcoin-oracle/instrument';
import {
  expoRetry,
  fastRetry,
  getLogger,
  got,
} from '@meta-protocols-oracle/commons';
import {
  APIOf,
  Enums,
  ModelIndexer,
  ValidatorName,
  m,
} from '@meta-protocols-oracle/types';
import { Inject } from '@nestjs/common';
import { RequestError } from 'got-cjs';
import { AuthClientService } from '../auth-client';
import { env } from '../env';
import { ApiClientService } from './api-client.interface';

// const headers = memoizee(() => ({
//   'x-service-type': Enums.ServiceType.enum.VALIDATOR,
//   authorization: `Bearer ${env().INDEXER_ACCESS_KEY}`,
// }));

export class DefaultApiClientService implements ApiClientService {
  private readonly baseURL = env().INDEXER_API_URL;
  constructor(
    @Inject(AuthClientService) private readonly authClient: AuthClientService,
  ) {}

  private async getAuthHeaders() {
    const token = await fastRetry(
      () => this.authClient.autoAuthAndRequestAccessToken(),
      'get-auth-headers',
    );
    return {
      authorization: `Bearer ${token}`,
      'x-version': '0.0.1',
    };
  }

  indexer() {
    const url = `${this.baseURL}/api/v1/indexer`;
    return {
      txs: () => {
        return {
          post: async (params: APIOf<'txs', 'request', 'json'>) => {
            try {
              const rs = await got
                .post(`${url}/txs`, {
                  headers: {
                    ...(await this.getAuthHeaders()),
                  },
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
      block: () => {
        return {
          get: async (params: { block_hash: string }) => {
            return expoRetry(
              async () =>
                got
                  .get(`${url}/block-hash/${params.block_hash}`, {
                    headers: {
                      ...(await this.getAuthHeaders()),
                    },
                    parseJson: body =>
                      m.database('indexer', 'blocks').parse(JSON.parse(body)),
                  })
                  .json<ModelIndexer<'blocks'>>(),
              'get block by block-hash',
            );
          },
        };
      },
      latest_block_number: () => {
        return {
          get: async (params: { type: ValidatorName | string }) => {
            return got
              .get(
                `${url}/latest-block-number/${Enums.ValidatorName.parse(
                  params.type,
                )}`,
                {
                  headers: {
                    ...(await this.getAuthHeaders()),
                  },
                },
              )
              .json<{ latest_block_number: number | null }>();
          },
        };
      },
      latest_block_number_range: () => {
        return {
          get: async (params: {
            type: ValidatorName | string;
            from: number;
            to: number;
          }) => {
            return got
              .get(
                `${url}/latest-block-number-range/${Enums.ValidatorName.parse(
                  params.type,
                )}?from=${params.from}&to=${params.to}`,
                {
                  headers: {
                    ...(await this.getAuthHeaders()),
                  },
                },
              )
              .json<{ latest_block_number: number | null }>();
          },
        };
      },
    };
  }
}

const ApiClientServiceProvider = {
  provide: ApiClientService,
  useClass: DefaultApiClientService,
};

export default ApiClientServiceProvider;
