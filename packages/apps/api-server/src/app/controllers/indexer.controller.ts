import { Indexer } from '@alex-b20/api';
import { IndexerType, m } from '@alex-b20/types';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class IndexerTxsCreateInput extends createZodDto(
  m.database('indexer', 'tx_with_proofs'),
) {}

const IndexerLatestBlockNumberOfProofResponseSchema = z.object({
  latest_block_number: z.coerce.number().nullable(),
});

export class IndexerLatestBlockNumberOfProofResponseDto extends createZodDto(
  IndexerLatestBlockNumberOfProofResponseSchema,
) {}

@Controller('/api/v1/indexer')
export class IndexerController {
  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}

  @Post('/txs')
  async txs(@Body() tx: IndexerTxsCreateInput) {
    await this.indexer.upsertTxWithProof(tx);
    return m.json('indexer', 'txs_post_response').parse({ message: 'ok' });
  }

  @Get('/block-hash/:block_hash')
  async blockNumberOfHeader(@Param('block_hash') block_hash: string) {
    return m
      .json('indexer', 'blocks')
      .parse(await this.indexer.getBlockByBlockHash(block_hash));
  }

  @Get('/latest-block-number/:type')
  async latestBlockNumberOfProof(@Param('type') type: IndexerType) {
    return IndexerLatestBlockNumberOfProofResponseSchema.parse({
      latest_block_number:
        (await this.indexer.getLatestBlockNumberOfProof(type))?.toString() ??
        null,
    });
  }
}
