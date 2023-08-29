import { Indexer } from '@alex-b20/api';
import { IndexerTxWithProofSchema } from '@alex-b20/types';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

export class IndexerTxsCreateInput extends createZodDto(
  IndexerTxWithProofSchema,
) {}

@Controller('/api/v1')
export class IndexerController {
  constructor(@Inject(Indexer) private readonly indexer: Indexer) {}
  @Post('/txs')
  async txs(@Body() tx: IndexerTxsCreateInput) {
    await this.indexer.upsertTxWithProof(tx); //?
    return 'ok';
  }
}
