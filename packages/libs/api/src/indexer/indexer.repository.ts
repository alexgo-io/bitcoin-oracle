import { SQL } from '@bitcoin-oracle/commons';
import { PersistentService } from '@bitcoin-oracle/persistent';
import { APIOf, m, ValidatorName } from '@bitcoin-oracle/types';
import { Inject } from '@nestjs/common';
import { Address, OutScript, Transaction } from 'scure-btc-signer-cjs';
import { z } from 'zod';

export class IndexerRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistentService: PersistentService,
  ) {}

  async upsertTxWithProof(tx: APIOf<'txs', 'request', 'dto'>) {
    return this.persistentService.pgPool.transaction(async conn => {
      await conn.query(SQL.typeAlias('void')`
          INSERT INTO indexer.proofs(type,
                                     order_hash,
                                     signature,
                                     amt,
                                     tx_hash,
                                     "from",
                                     from_bal,
                                     satpoint,
                                     output,
                                     tick,
                                     "to",
                                     to_bal,
                                     signer)
          VALUES (${tx.type},
                  ${SQL.binary(tx.order_hash)},
                  ${SQL.binary(tx.signature)},
                  ${tx.amt.toString()},
                  ${SQL.binary(tx.tx_hash)},
                  ${SQL.binary(tx.from)},
                  ${tx.from_bal.toString()},
                  ${tx.satpoint.toString()},
                  ${tx.output.toString()},
                  ${tx.tick},
                  ${SQL.binary(tx.to)},
                  ${tx.to_bal.toString()},
                  ${tx.signer})
          on conflict do nothing;
          ;
      `);

      const existing = await conn.maybeOne(SQL.typeAlias('indexer_txs')`
          select *
          from indexer.txs
          where tx_hash = ${SQL.binary(tx.tx_hash)}
            and header = ${SQL.binary(tx.header)}
            and output = ${tx.output.toString()}
          ;
      `);

      if (existing != null) {
        return;
      }

      const tx_id = Buffer.from(
        Transaction.fromRaw(tx.tx_hash, { allowUnknownOutputs: true }).id,
        'hex',
      );
      const from_address = Address().encode(OutScript.decode(tx.from));
      const to_address = Address().encode(OutScript.decode(tx.to));

      await conn.query(SQL.typeAlias('void')`
          INSERT INTO indexer.txs(header,
                                  height,
                                  tx_hash,
                                  tx_id,
                                  from_address,
                                  to_address,
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
          VALUES (${SQL.binary(tx.header)},
                  ${tx.height.toString()},
                  ${SQL.binary(tx.tx_hash)},
                  ${SQL.binary(tx_id)},
                  ${from_address},
                  ${to_address},
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
    });
  }

  async getBlockByBlockHash(hash: Buffer) {
    return this.persistentService.pgPool.maybeOne(SQL.typeAlias(
      'indexer_block',
    )`
        select *
        from indexer.blocks
        where block_hash = ${SQL.binary(hash)}
        limit 1;
    `);
  }

  async getLatestBlockNumberOfProof(type: ValidatorName) {
    return this.persistentService.pgPool.one(SQL.type(
      z.object({ lasted_block_number: z.bigint().nullable() }),
    )`
        select max(height) as lasted_block_number
        from indexer.txs
        join indexer.proofs p on p.id = txs.id
        where p.type = ${type}
    `);
  }

  async findDebugInfo(params: APIOf<'debug_txs', 'request', 'dto'>) {
    const whereClause = generateProofFilter(params);

    return this.persistentService.pgPool.any(SQL.type(
      m.api('debug_txs', 'response', 'dto'),
    )`
        with pf as (select p.id,
                           p.type,
                           json_build_object(
                                   'type', p.type,
                                   'satpoint', p.satpoint,
                                   'output', p.output,
                                   'signer', p.signer,
                                   'signature', p.signature,
                                   'order_hash', p.order_hash
                               ) as proof
                    from indexer.proofs p),
             with_json_pf as (select t.id,
                                     count(*)           as proofs_count,
                                     json_agg(pf.proof) as proofs
                              from indexer.txs t
                                       join pf on pf.id = t.id
                              group by 1),
             with_tx as (select t.tx_hash,
                                t.output,
                                t.satpoint,
                                t.tx_id,
                                t.from_address,
                                t.to_address,
                                t.header,
                                t.proof_hashes,
                                t.tx_index,
                                t.tree_depth,
                                t."from",
                                t."to",
                                t.tick,
                                t.amt,
                                t.from_bal,
                                t.to_bal,
                                t.height,
                                with_json_pf.proofs_count,
                                with_json_pf.proofs,
                                st.stacks_tx_id          as stacks_tx_id,
                                st.submitted_by          as stacks_submitted_by,
                                st.submitted_at          as stacks_submitted_at,
                                st.submitter_nonce       as stacks_submitter_nonce,
                                st.broadcast_result_type as stacks_broadcast_result,
                                st.error                 as stacks_error,
                                b.header                 as block_header,
                                b.block_hash             as block_hash
                         from indexer.txs t
                                  join with_json_pf on with_json_pf.id = t.id
                                  join indexer.blocks b on t.height = b.height
                                  left join indexer.submitted_tx st on st.id = t.id)
        select *
        from with_tx t
            ${whereClause}
    `);
  }

  // async getMissingBlockNumbers(type: ValidatorName) {
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

function generateProofFilter(params: APIOf<'debug_txs', 'request', 'dto'>) {
  const pairs = Object.entries(params).map(([key, value]) => {
    if (typeof value === 'bigint') {
      return SQL.fragment`
        ${SQL.identifier([key])} = ${value.toString(10)}
      `;
    }
    if (value instanceof Buffer) {
      return SQL.fragment`
        ${SQL.identifier([key])} = ${SQL.binary(value)}
      `;
    }
    return SQL.fragment`
        ${SQL.identifier([key])} = ${value}
      `;
  });

  return SQL.fragment`WHERE ${SQL.join(pairs, SQL.fragment` AND `)}`;
}
