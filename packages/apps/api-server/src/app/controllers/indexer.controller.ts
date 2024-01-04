import {
  Indexer,
  IndexerError,
  ValidatedTxsQuery,
  ValidatedTxsQuerySchema,
} from '@bitcoin-oracle/api';
import { ErrorDetails } from '@meta-protocols-oracle/commons';
import {
  APIOf,
  StatusCode,
  ValidatorName,
  m,
} from '@meta-protocols-oracle/types';
import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AuthGuard } from '../guards/auth.guard';

export class IndexerTxsCreateInput extends createZodDto(
  m.api('txs', 'request', 'dto'),
) {}

const IndexerLatestBlockNumberOfProofResponseSchema = z.object({
  latest_block_number: z.coerce.number().nullable(),
});

export class IndexerLatestBlockNumberOfProofResponseDto extends createZodDto(
  IndexerLatestBlockNumberOfProofResponseSchema,
) {}

@UseGuards(AuthGuard)
@Controller('/api/v1/indexer')
export class IndexerController {
  private readonly logger = new Logger(IndexerController.name);
  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}

  @Post('/txs')
  async txs(@Body() tx: IndexerTxsCreateInput) {
    try {
      await this.indexer.upsertTxWithProof(tx);
    } catch (error) {
      if (error instanceof IndexerError) {
        throw ErrorDetails.from(
          StatusCode.INVALID_ARGUMENT,
          error.message,
        ).throwHttpException();
      } else {
        throw error;
      }
    }
    return m.api('txs', 'response', 'json').parse({ message: 'ok' });
  }

  @Get('/block-hash/:block_hash')
  async blockNumberOfHeader(@Param('block_hash') block_hash: string) {
    return m
      .api('blocks', 'response', 'json')
      .parse(await this.indexer.getBlockByBlockHash(block_hash));
  }

  @Get('/latest-block-number/:type')
  async latestBlockNumberOfProof(@Param('type') type: ValidatorName) {
    return IndexerLatestBlockNumberOfProofResponseSchema.parse({
      latest_block_number:
        (await this.indexer.getLatestBlockNumberOfProof(type))?.toString() ??
        null,
    });
  }

  @Get('/latest-block-number-range/:type')
  async latestBlockNumberOfProofRange(
    @Param('type') type: ValidatorName,
    @Query('from') from: number,
    @Query('to') to: number,
  ) {
    const latestBlockNumber = await this.indexer.getLatestBlockInRange(
      type,
      BigInt(from),
      BigInt(to),
    );

    return {
      latest_block_number: latestBlockNumber?.toString() ?? null,
    };
  }

  @Post('/validated-txs')
  async validatedTxs(@Body() params: ValidatedTxsQuery) {
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
}

function rename(
  object: Record<string, unknown>,
  oldName: string,
  newName: string,
) {
  object[newName] = object[oldName];
  delete object[oldName];
}

@Controller('/debug')
export class DebugIndexerController {
  private readonly logger = new Logger(DebugIndexerController.name);
  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}

  @Get('/query')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async debugQuery(@Query() params: APIOf<'debug_txs', 'request', 'json'>) {
    this.logger.debug(`debugQuery: ${JSON.stringify(params)}`);

    const dto = m.api('debug_txs', 'request', 'dto').parse(params);
    const txs = await this.indexer.findDebugInfo(dto);

    return txs.map(t => {
      const parse = m.api('debug_txs', 'response', 'json').parse(t);
      rename(parse, 'satpoint', 'offset');
      return parse;
    });
  }
}
