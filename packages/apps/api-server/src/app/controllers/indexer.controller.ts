import { Indexer } from '@alex-b20/api';
import {
  IndexerBlockJSONSchema,
  IndexerTxsPostResponseSchema,
  IndexerTxWithProofSchema,
} from '@alex-b20/types';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

export class IndexerTxsCreateInput extends createZodDto(
  IndexerTxWithProofSchema,
) {}

// class IndexerBlockNumberOfHeaderResponseDto extends createZodDto(
//   z.object({
//     block_number: z.string().nullable(),
//   }),
// ) {}
@Controller('/api/v1/indexer')
export class IndexerController {
  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}
  @Post('/txs')
  async txs(@Body() tx: IndexerTxsCreateInput) {
    await this.indexer.upsertTxWithProof(tx);
    return IndexerTxsPostResponseSchema.parse({ message: 'ok' });
  }

  @Get('/block-hash/:block_hash')
  async blockNumberOfHeader(@Param('block_hash') block_hash: string) {
    return IndexerBlockJSONSchema.parse(
      await this.indexer.getBlockByBlockHash(block_hash),
    );
  }
}
