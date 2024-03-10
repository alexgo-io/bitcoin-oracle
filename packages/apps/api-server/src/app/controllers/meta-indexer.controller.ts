import { Indexer, ValidatedTxsQuerySchema } from '@meta-protocols-oracle/api';
import { ErrorDetails } from '@meta-protocols-oracle/commons';
import { StatusCode } from '@meta-protocols-oracle/types';
import {
  Body,
  Controller,
  HttpCode,
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
      tx_id: {
        summary: 'query by tx_id, output and offset',
        value: {
          type: 'tx_id',
          tx_id:
            '498f108b18f5a5b2dec1f31133c7da8260b44711c1bd387728eb51ac146e1d7f',
          output: 0,
          offset: 0,
        },
      },
      id: {
        summary: 'query by tx_hash(raw), output and offset',
        value: {
          type: 'id',
          tx_hash:
            '02000000000102ba8119c7394b0bfab1ced286e7a9086be8b918f9aafbce384f6e1860a667134e0000000000000000001962982a74711b1ba34d8cf0ef0ef53ae9e0b044b1b7a72827375508b1fead2e0100000000000000000222020000000000002251207e875ae46c9f2d28d8d302cfa8c045bfc94df9277dbdf2d7a1fcdba129731899b423e40000000000160014aa6558c31522e6684369f4581481b259a39681ee01406701bbe54fa9c361a083ae10818396c6f5654fae1e7f82061a443f8e530e848325d61eb1c7332955378e23f4fe4ecd583a03b78545db4b5d2dfa2871c83626920247304402201bdd14414873c527c3329bb874c07099796859b272be4f2c90aa1407f39c165302201eb7a35de8fb2322cdcba1bb6a9cd474e76a6b29c876eede4c43b1101bf7a11b012102bb5daef39cb336f6b7ae8c293374c9dce0aafaf212bdf0bfd8cdd631944d599000000000',
          output: 0,
          offset: 0,
        },
      },
    },
  })
  @Post('/')
  @HttpCode(200)
  async query(@Body() params: MetaIndexerQueryIndexingDTO) {
    return await this.getValidatedTxs(params);
  }

  @SkipThrottle()
  @UseGuards(AuthGuard)
  @Post('/advanced')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async validatedTxsUnlimited(@Body() params: MetaIndexerQueryIndexingDTO) {
    return await this.getValidatedTxs(params);
  }
}
