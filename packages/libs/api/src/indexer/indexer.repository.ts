import { SQL } from '@alex-b20/commons';
import { PersistentService } from '@alex-b20/persistent';
import { IndexerTxWithProof } from '@alex-b20/types';
import { Inject } from '@nestjs/common';

function same<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) {
    throw new Error(msg);
  }
}

export class IndexerRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistentService: PersistentService,
  ) {}

  async upsertTxWithProof(tx: IndexerTxWithProof) {
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
        same(existing.type, tx.type, `!type ${tx.tx_id}`);
        same(existing.height, tx.height, `!height ${tx.tx_id}`);
        same(existing.tx_index, tx.tx_index, `!tx_index ${tx.tx_id}`);
        same(existing.tree_depth, tx.tree_depth, `!tree_depth ${tx.tx_id}`);
        same(existing.from, tx.from, `!from ${tx.tx_id}`);
        same(existing.to, tx.to, `!to ${tx.tx_id}`);
        same(existing.tick, tx.tick, `!tick ${tx.tx_id}`);
        same(existing.amt, tx.amt, `!amt ${tx.tx_id}`);
        same(existing.satpoint, tx.satpoint, `!satpoint ${tx.tx_id}`);
        same(existing.from_bal, tx.from_bal, `!from_bal ${tx.tx_id}`);
        same(existing.to_bal, tx.to_bal, `!to_bal ${tx.tx_id}`);
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
                INSERT INTO indexer.proofs(type,
                                           order_hash,
                                           signature,
                                           signer)
                VALUES (${tx.type},
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
}
