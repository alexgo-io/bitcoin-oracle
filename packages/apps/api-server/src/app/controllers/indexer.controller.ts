import { IndexerTxWithProofSchema } from '@alex-b20/types';
import { Body, Controller, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

export class IndexerTxsCreateInput extends createZodDto(
  IndexerTxWithProofSchema,
) {}

@Controller('/api/v1')
export class IndexerController {
  @Post('/txs')
  async txs(@Body() body: IndexerTxsCreateInput) {
    return 'ok';
  }
}
