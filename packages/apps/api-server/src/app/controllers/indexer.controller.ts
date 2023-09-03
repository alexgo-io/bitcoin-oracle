import { Indexer } from '@alex-b20/api';
import {
  IndexerTxsPostResponseSchema,
  IndexerTxWithProofSchema,
} from '@alex-b20/types';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from "zod";

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

  @Get('/block-number/:header')
  async blockNumberOfHeader(header: string) {
    const result = await this.indexer.blockNumberOfHeader(header);
    if (result == null) {
      return { block_number: null };
    }
    return { block_number: result.toString() };
  }
}
