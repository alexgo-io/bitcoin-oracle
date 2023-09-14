import { SQL } from '@alex-b20/commons';
import { PersistentService } from '@alex-b20/persistent';
import { IndexerType, ModelOf } from '@alex-b20/types';
import { Inject } from '@nestjs/common';
import { z } from 'zod';

export class IndexerRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistentService: PersistentService,
  ) {}

  async upsertTxWithProof(tx: ModelOf<'indexer', 'tx_with_proofs'>) {
    return this.persistentService.pgPool.transaction(async conn => {
      const existing = await conn.maybeOne(SQL.typeAlias('indexer_txs')`
                select *
                from indexer.txs
                where tx_id = ${SQL.binary(tx.tx_id)}
                  and header = ${SQL.binary(tx.header)}
                  and output = ${tx.output.toString()}
                ;
            `);

      if (existing != null) {
        return;
      }

      await conn.query(SQL.typeAlias('void')`
                INSERT INTO indexer.txs(type,
                                        header,
                                        height,
                                        tx_id,
                                        proof_hashes,
                                        tx_index,
                                        tree_depth,
                                        "from",
                                        "to",
                                        output,
                                        tick,
                                        amt,
                                        satpoint,
                                        from_bal,
                                        to_bal)
                VALUES (${tx.type},
                        ${SQL.binary(tx.header)},
                        ${tx.height.toString()},
                        ${SQL.binary(tx.tx_id)},
                        ${SQL.array(tx.proof_hashes, 'bytea')},
                        ${tx.tx_index.toString()},
                        ${tx.tree_depth.toString()},
                        ${SQL.binary(tx.from)},
                        ${SQL.binary(tx.to)},
                        ${tx.output.toString()},
                        ${tx.tick},
                        ${tx.amt.toString()},
                        ${tx.satpoint.toString()},
                        ${tx.from_bal.toString()},
                        ${tx.to_bal.toString()});
            `);

      await conn.query(SQL.typeAlias('void')`
                INSERT INTO indexer.proofs(tx_id,
                                           output,
                                           satpoint,
                                           type,
                                           order_hash,
                                           signature,
                                           signer)
                VALUES (${SQL.binary(tx.tx_id)},
                        ${tx.output.toString()},
                        ${tx.satpoint.toString()},
                        ${tx.type},
                        ${SQL.binary(tx.order_hash)},
                        ${SQL.binary(tx.signature)},
                        ${tx.signer})
                on conflict do nothing;
                ;
            `);
    });
  }

  async getBlockByBlockHash(hash: Buffer) {
    return this.persistentService.pgPool.maybeOne(SQL.typeAlias(
      'indexer_block',
    )`
      select * from indexer.blocks
               where block_hash = ${SQL.binary(hash)}
      limit 1;
    `);
  }

  async getLatestBlockNumberOfProof(type: IndexerType) {
    return this.persistentService.pgPool.one(SQL.type(
      z.object({ lasted_block_number: z.bigint().nullable() }),
    )`
      select max(height) as lasted_block_number from indexer.txs
               where type = ${type}
    `);
  }

  // async getMissingBlockNumbers(type: IndexerType) {
  //   return this.persistentService.pgPool.query(SQL.type(
  //     z.object({
  //       missing_blocks: z.array(z.bigint()),
  //     }),
  //   )`
  //       SELECT s.i AS missing_blocks
  //       FROM generate_series(700000, (select max(height) from indexer.blocks)) s(i)
  //       WHERE NOT EXISTS (SELECT 1 FROM indexer.blocks
  //                                  WHERE height = s.i
  //                                  );
  //   `);
  // }
}
