import { Indexer, ValidatedTxsQuerySchema } from '@bitcoin-oracle/api';
import { ErrorDetails } from '@meta-protocols-oracle/commons';
import { StatusCode } from '@meta-protocols-oracle/types';
import {
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiExcludeEndpoint } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../guards/auth.guard';
import { ThrottlerBehindProxyGuard } from '../guards/throttler-behind-proxy.guard';
import { MetaIndexerQueryIndexingDTO } from './meta-indexer.type';

@UseGuards(ThrottlerBehindProxyGuard)
@Controller('/v1/brc20')
export class MetaIndexerController {
  private readonly logger = new Logger(MetaIndexerController.name);

  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}

  private async getValidatedTxs(params: MetaIndexerQueryIndexingDTO) {
    if (params.type == null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (params as any).type = 'indexing';
    }
    const parsedParams = ValidatedTxsQuerySchema.parse(params);

    if (parsedParams.type === 'indexing') {
      if (
        parsedParams.tick?.length === 0 &&
        parsedParams.from?.length === 0 &&
        parsedParams.to?.length === 0 &&
        parsedParams.height == null
      ) {
        throw ErrorDetails.from(
          StatusCode.INVALID_ARGUMENT,
          'At least one of tick, from, to, block_number must be provided',
        ).throwHttpException();
      }
    }

    const txs = await this.indexer.getValidatedTxs(parsedParams);
    return {
      data: txs,
    };
  }

  @Post('/')
  @ApiBody({
    required: true,
    description: `The query performs a match against an array where each item represents a distinct condition. If multiple query parameters are specified, such as \`from\` and \`height\`, the returned transactions (\`txs\`) must satisfy all the given conditions concurrently. Therefore, only transactions that have been sent from the specified \`from\` address and occurred at the given \`height\` will be included in the result set. The system supports query conditions for addresses in two formats: Bech32 and PKScript.`,
    // schema: {
    //   oneOf: [{ $ref: getSchemaPath(MetaIndexerQueryIndexingDTO) }],
    //   discriminator: {
    //     propertyName: 'type',
    //     mapping: {
    //       indexing: getSchemaPath(MetaIndexerQueryIndexingDTO),
    //     },
    //   },
    // },
    type: MetaIndexerQueryIndexingDTO,
    examples: {
      query: {
        summary: 'aggregated query',
        description: `It shows the aggregated query with multiple conditions.`,
        value: {
          type: 'indexing',
          tick: ['ORMM'],
          from: [
            'bc1pngxflzuqe5vevtc8fgmxzl69pw74x36dc9pmv5rye6nhwty0c0hsh5tyr3',
          ],
          to: [
            '5120540910c558f9e34864ee8c8712436fd8095b86c1ce1ff4af8d6bada6d0687ea7',
          ],
          from_or_to: [
            'bc1p2sy3p32cl835se8w3jr3ysm0mqy4hpkpec0lftuddwk6d5rg06ns0kyedp',
          ],
          height: [813349],
        },
      },
      to: {
        summary: 'query by address to',
        value: {
          type: 'indexing',
          to: [
            'bc1pngxflzuqe5vevtc8fgmxzl69pw74x36dc9pmv5rye6nhwty0c0hsh5tyr3',
            '51209a0c9f8b80cd19962f074a36617f450bbd53474dc143b65064cea7772c8fc3ef',
          ],
        },
      },
      from: {
        summary: 'query by address from',
        value: {
          type: 'indexing',
          from: [
            'bc1pngxflzuqe5vevtc8fgmxzl69pw74x36dc9pmv5rye6nhwty0c0hsh5tyr3',
            '51209a0c9f8b80cd19962f074a36617f450bbd53474dc143b65064cea7772c8fc3ef',
          ],
        },
      },
      from_or_to: {
        summary: 'query by address from or to',
        value: {
          type: 'indexing',
          from_or_to: [
            'bc1pngxflzuqe5vevtc8fgmxzl69pw74x36dc9pmv5rye6nhwty0c0hsh5tyr3',
            '51209a0c9f8b80cd19962f074a36617f450bbd53474dc143b65064cea7772c8fc3ef',
          ],
        },
      },
      height: {
        summary: 'query by block number',
        value: {
          type: 'indexing',
          height: [814677, 814678],
        },
      },
      tick: {
        summary: 'query by tick',
        value: {
          type: 'indexing',
          tick: ['ORDI'],
          limit: 10,
        },
      },
    },
  })
  async query(@Body() params: MetaIndexerQueryIndexingDTO) {
    return await this.getValidatedTxs(params);
  }

  @SkipThrottle()
  @UseGuards(AuthGuard)
  @Post('/advanced')
  @ApiExcludeEndpoint()
  async validatedTxsUnlimited(@Body() params: MetaIndexerQueryIndexingDTO) {
    return await this.getValidatedTxs(params);
  }
}
