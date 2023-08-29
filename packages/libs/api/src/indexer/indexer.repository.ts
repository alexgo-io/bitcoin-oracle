import { sql } from '@alex-b20/commons';
import { PersistentService } from '@alex-b20/persistent';
import { IndexerTxWithProof } from '@alex-b20/types';
import { Inject } from '@nestjs/common';

/*
create table indexer.txs
(
    "type"         text        not null,
    "header"       bytea       not null,
    "height"       integer     not null,
    "tx_id"        bytea       not null,
    "proof_hashes" bytea[]     not null,
    "tx_index"     integer     not null,
    "tree_depth"   integer     not null,
    "from"         bytea       not null,
    "to"           bytea       not null,
    "output"       integer     not null,
    "tick"         text        not null,
    "amt"          numeric     not null,
    "bitcoin_tx"   bytea       not null,
    "from_bal"     numeric     not null,
    "to_bal"       numeric     not null,
    "created_at"   timestamptz not null default now(),
    "updated_at"   timestamptz not null default now()
);
CREATE INDEX tx_height ON indexer.txs (height);

create table indexer.proofs
(
    "type"       text        not null,
    "order_hash" bytea       not null,
    "signature"  bytea       not null,
    "signer"     text        not null,
    unique ("order_hash", "signature", "signer"),
    "created_at" timestamptz not null default now(),
    "updated_at" timestamptz not null default now()
);
CREATE INDEX proof_order_hash ON indexer.proofs (order_hash);
 */

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
      const existing = await conn.maybeOne(sql.typeAlias('indexer_txs')`
                select *
                from indexer.txs
                where tx_id = ${sql.binary(tx.tx_id)}
                  and header = ${sql.binary(tx.header)}
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
        same(existing.bitcoin_tx, tx.bitcoin_tx, `!bitcoin_tx ${tx.tx_id}`);
        same(existing.from_bal, tx.from_bal, `!from_bal ${tx.tx_id}`);
        same(existing.to_bal, tx.to_bal, `!to_bal ${tx.tx_id}`);
        return;
      }

      await conn.query(sql.typeAlias('void')`
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
                                        bitcoin_tx,
                                        from_bal,
                                        to_bal)
                VALUES (${tx.type},
                        ${sql.binary(tx.header)},
                        ${tx.height.toString()},
                        ${sql.binary(tx.tx_id)},
                        ${sql.array(tx.proof_hashes, 'bytea')},
                        ${tx.tx_index.toString()},
                        ${tx.tree_depth.toString()},
                        ${sql.binary(tx.from)},
                        ${sql.binary(tx.to)},
                        ${tx.output.toString()},
                        ${tx.tick},
                        ${tx.amt.toString()},
                        ${sql.binary(tx.bitcoin_tx)},
                        ${tx.from_bal.toString()},
                        ${tx.to_bal.toString()});
            `);

      await conn.query(sql.typeAlias('void')`
                INSERT INTO indexer.proofs(type,
                                           order_hash,
                                           signature,
                                           signer)
                VALUES (${tx.type},
                        ${sql.binary(tx.order_hash)},
                        ${sql.binary(tx.signature)},
                        ${tx.signer})
                on conflict do nothing;
                ;
            `);
    });
  }
}
