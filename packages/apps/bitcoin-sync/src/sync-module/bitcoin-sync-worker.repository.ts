import { SQL } from '@alex-b20/commons';
import { PersistentService } from '@alex-b20/persistent';
import { BigIntSchema, ModelIndexer } from '@alex-b20/types';
import { Inject } from '@nestjs/common';
import { z } from 'zod';

export class BitcoinSyncWorkerRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistentService: PersistentService,
  ) {}

  async upsertBlock(block: ModelIndexer<'blocks'>) {
    return await this.persistentService.pgPool.any(SQL.type(
      z.object({ height: BigIntSchema }),
    )`
      insert into indexer.blocks (height, header, block_hash, canonical)
      VALUES (${block.height.toString()},
              ${SQL.binary(block.header)},
              ${SQL.binary(block.block_hash)},
              ${block.canonical.toString()})
      on conflict (height, header) do update
        set canonical = ${block.canonical.toString()}
      returning height;
    `);
  }

  async latestBlock(): Promise<ModelIndexer<'blocks'> | null> {
    return this.persistentService.pgPool.maybeOne(SQL.typeAlias(
      'indexer_block',
    )`
      select *
      from indexer.blocks
      order by height desc
      limit 1
    `);
  }

  async getMissingBlocks(startedAt: number) {
    return this.persistentService.pgPool.query(SQL.type(
      z.object({ missing_block: z.bigint() }),
    )`
        SELECT s.i AS missing_block
        FROM generate_series(${startedAt}, (select max(height) from indexer.blocks)) s(i)
        WHERE NOT EXISTS (SELECT 1 FROM indexer.blocks WHERE height = s.i);
    `);
  }
}
