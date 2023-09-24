import { Indexer } from '@alex-b20/api';
import { ValidatorName, m } from '@alex-b20/types';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
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
  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}

  @Post('/txs')
  async txs(@Body() tx: IndexerTxsCreateInput) {
    await this.indexer.upsertTxWithProof(tx);
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
}
