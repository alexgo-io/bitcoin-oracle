import {
  Indexer,
  ValidatedTxsQuery,
  ValidatedTxsQuerySchema,
} from '@bitcoin-oracle/api';
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
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../guards/auth.guard';
import { ThrottlerBehindProxyGuard } from '../guards/throttler-behind-proxy.guard';

@UseGuards(ThrottlerBehindProxyGuard)
@Controller('/v1/brc20')
export class MetaIndexerController {
  private readonly logger = new Logger(MetaIndexerController.name);
  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}

  private async getValidatedTxs(params: ValidatedTxsQuery) {
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
  async validatedTxs(@Body() params: ValidatedTxsQuery) {
    return await this.getValidatedTxs(params);
  }

  @SkipThrottle()
  @UseGuards(AuthGuard)
  @Post('/advanced')
  async validatedTxsUnlimited(@Body() params: ValidatedTxsQuery) {
    return await this.getValidatedTxs(params);
  }
}
