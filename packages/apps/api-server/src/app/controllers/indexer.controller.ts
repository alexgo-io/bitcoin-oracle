import { Indexer } from '@alex-b20/api';
import {
  IndexerBlockJSONSchema,
  IndexerTxsPostResponseSchema,
  IndexerTxWithProofSchema,
} from '@alex-b20/types';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class IndexerTxsCreateInput extends createZodDto(
  IndexerTxWithProofSchema,
) {}

// class IndexerBlockNumberOfHeaderResponseDto extends createZodDto(
//   z.object({
//     block_number: z.string().nullable(),
//   }),
// ) {}

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
    return IndexerTxsPostResponseSchema.parse({ message: 'ok' });
  }

  @Get('/block-hash/:block_hash')
  async blockNumberOfHeader(@Param('block_hash') block_hash: string) {
    return IndexerBlockJSONSchema.parse(
      await this.indexer.getBlockByBlockHash(block_hash),
    );
  }

  @Get('/latest-block-number/:type')
  async latestBlockNumberOfProof(
    @Param('type') type: string,
  ) {
    return IndexerLatestBlockNumberOfProofResponseSchema.parse({
      latest_block_number:
        (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await this.indexer.getLatestBlockNumberOfProof(type as any)
        )?.toString() ?? null,
    });
  }
}
