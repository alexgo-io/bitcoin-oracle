import { SQL } from '@alex-b20/commons';
import { PersistentService } from '@alex-b20/persistent';
import { IndexerBlock } from '@alex-b20/types';
import { Inject } from '@nestjs/common';

export class BitcoinSyncWorkerRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistentService: PersistentService,
  ) {}

  async upsertBlock(block: IndexerBlock) {
    await this.persistentService.pgPool.query(SQL.typeAlias('void')`
      insert into indexer.blocks (height, header, canonical)
      VALUES (${block.height.toString()},
              ${SQL.binary(block.header)},
              ${block.canonical.toString()})
      on conflict (header, header) do update
        set canonical = ${block.canonical.toString()}
    `);
  }

  async latestBlock(): Promise<IndexerBlock | null> {
    return this.persistentService.pgPool.maybeOne(SQL.typeAlias(
      'indexer_block',
    )`
      select *
      from indexer.blocks
      order by height desc
      limit 1
    `);
  }
}
