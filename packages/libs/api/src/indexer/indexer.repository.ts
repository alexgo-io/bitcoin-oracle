import {
  assertNever,
  computeTxsId,
  computeValidatedTxsId,
  SQL,
} from '@meta-protocols-oracle/commons';
import { PersistentService } from '@meta-protocols-oracle/persistent';
import { APIOf, m, ValidatorName } from '@meta-protocols-oracle/types';
import { Inject } from '@nestjs/common';
import { Address, OutScript, Transaction } from 'scure-btc-signer-cjs';
import { z } from 'zod';
import { IndexerError, ValidatedTxsQuery } from './indexer.interface';

function encodeAddress(address: Buffer) {
  try {
    return Address().encode(OutScript.decode(address));
  } catch (e) {
    throw new IndexerError(
      `Failed to encode address: ${address.toString('hex')}, ${e}`,
    );
  }
}

export class IndexerRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistentService: PersistentService,
  ) {}

  async upsertTxWithProof(tx: APIOf<'txs', 'request', 'dto'>) {
    return this.persistentService.pgPool.transaction(async conn => {
      const tx_id = Buffer.from(
        Transaction.fromRaw(tx.tx_hash, { allowUnknownOutputs: true }).id,
        'hex',
      );
      const from_address = encodeAddress(tx.from);
      const to_address = encodeAddress(tx.to);

      await conn.query(SQL.typeAlias('void')`
          INSERT INTO indexer.proofs(type,
                                     order_hash,
                                     signature,
                                     amt,
                                     decimals,
                                     tx_hash,
                                     "from",
                                     from_bal,
                                     satpoint,
                                     output,
                                     tick,
                                     "to",
                                     to_bal,
                                     signer,
                                     from_address,
                                     to_address,
                                     tx_id)
          VALUES (${tx.type},
                  ${SQL.binary(tx.order_hash)},
                  ${SQL.binary(tx.signature)},
                  ${tx.amt.toString()},
                  ${tx.decimals.toString()},
                  ${SQL.binary(tx.tx_hash)},
                  ${SQL.binary(tx.from)},
                  ${tx.from_bal.toString()},
                  ${tx.satpoint.toString()},
                  ${tx.output.toString()},
                  ${tx.tick},
                  ${SQL.binary(tx.to)},
                  ${tx.to_bal.toString()},
                  ${tx.signer},
                  ${from_address},
                  ${to_address},
                  ${SQL.binary(tx_id)}
                  )
          on conflict do nothing;
          ;
      `);

      const computedId = computeTxsId(
        tx.tx_hash,
        tx.output.toString(10),
        tx.satpoint.toString(10),
      );

      const existing = await conn.maybeOne(SQL.typeAlias('indexer_txs')`
          select *
          from indexer.txs
          where id = ${SQL.binary(computedId)}
          ;
      `);

      if (existing != null) {
        return;
      }

      await conn.query(SQL.typeAlias('void')`
          INSERT INTO indexer.txs(header,
                                  height,
                                  tx_hash,
                                  tx_id,
                                  proof_hashes,
                                  tx_index,
                                  tree_depth,
                                  output,
                                  satpoint
                                  )
          VALUES (${SQL.binary(tx.header)},
                  ${tx.height.toString()},
                  ${SQL.binary(tx.tx_hash)},
                  ${SQL.binary(tx_id)},
                  ${SQL.array(tx.proof_hashes, 'bytea')},
                  ${tx.tx_index.toString()},
                  ${tx.tree_depth.toString()},
                  ${tx.output.toString()},
                  ${tx.satpoint.toString()});
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
    const api_schema = m
      .api('debug_txs', 'response', 'dto')
      .merge(m.database('indexer', 'has_id'));
    const proof_schema = m.database('indexer', 'proofs');
    const result_schema = api_schema.merge(
      z.object({
        proofs: z.array(proof_schema),
      }),
    );
    type ResultType = z.infer<typeof result_schema>;

    return this.persistentService.pgPool.transaction(async conn => {
      const txs = await conn.any(SQL.type(api_schema)`
        with pf as (select p.id,
                           p.type
                    from indexer.proofs p),
             with_pf_count as (select t.id,
                                     count(*)           as proofs_count
                              from indexer.txs t
                                     join pf on pf.id = t.id
                              group by 1),
             with_tx as (select t.id,
                                t.tx_hash,
                                t.output,
                                t.satpoint,
                                t.tx_id,
                                t.header,
                                t.proof_hashes,
                                t.tx_index,
                                t.tree_depth,
                                t.height,
                                t.error                  as tx_error,
                                with_pf_count.proofs_count,
                                st.stacks_tx_id          as stacks_tx_id,
                                st.submitted_by          as stacks_submitted_by,
                                st.submitted_at          as stacks_submitted_at,
                                st.submitter_nonce       as stacks_submitter_nonce,
                                st.broadcast_result_type as stacks_broadcast_result,
                                st.error                 as stacks_error,
                                b.header                 as block_header,
                                b.block_hash             as block_hash
                         from indexer.txs t
                                join with_pf_count on with_pf_count.id = t.id
                                join indexer.blocks b on t.height = b.height
                                left join indexer.submitted_tx st on st.id = t.id)
        select *
        from with_tx t
          ${whereClause}
      `);

      const results: ResultType[] = [];

      for (const t of txs) {
        const proofs = await conn.any(SQL.type(proof_schema)`
          select *
          from indexer.proofs p
          where p.id = ${SQL.binary(t.id)}
        `);
        results.push(
          result_schema.parse({
            ...t,
            proofs,
          }),
        );
      }

      return results;
    });
  }

  async getValidatedTxs(
    query: ValidatedTxsQuery,
  ): Promise<readonly APIOf<'validated_txs', 'response', 'json'>[]> {
    const responseModel = m.api('validated_txs', 'response', 'json');
    switch (query.type) {
      case 'id': {
        return await this.persistentService.pgPool.any(SQL.type(responseModel)`
          select *
          from indexer.validated_txs vt
          where vt.id = ${SQL.binary(
            computeTxsId(
              query.tx_hash,
              query.output.toString(10),
              query.offset.toString(10),
            ),
          )}
          ;
        `);
      }
      case 'id2': {
        const computedId = computeValidatedTxsId(
          query.tx_hash,
          query.order_hash,
        );
        return await this.persistentService.pgPool.any(SQL.type(responseModel)`
          select *
          from indexer.validated_txs
          where id = ${SQL.binary(computedId)};
        `);
      }
      case 'to': {
        return this.persistentService.pgPool.any(SQL.type(responseModel)`
          select *
          from indexer.validated_txs vt
          where vt.to = ${SQL.binary(query.to)}
          ${SQL.fragment` and vt.updated_at > ${SQL.timestamp(
            query.after_updated_at ?? new Date(Date.UTC(1970, 0, 1, 0, 0, 0)),
          )}`}
          order by vt.updated_at
          limit ${query.limit}
        `);
      }
      default: {
        assertNever(query);
      }
    }
  }
}

function generateProofFilter(params: APIOf<'debug_txs', 'request', 'dto'>) {
  const pairs = Object.entries(params).map(([key, value]) => {
    if (key === 'tx_error') {
      return SQL.fragment`
        ${SQL.identifier([key])} is not null
      `;
    }

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
