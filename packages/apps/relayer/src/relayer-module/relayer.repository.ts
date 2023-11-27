import { SQL } from '@meta-protocols-oracle/commons';

import { PersistentService } from '@meta-protocols-oracle/persistent';
import { m, ModelIndexer } from '@meta-protocols-oracle/types';
import { Inject, Logger } from '@nestjs/common';
import { z } from 'zod';
import { env } from '../env';
import { shouldHandleForKey } from '../sharding';
import { getWhitelistBRC20TokensCached } from './relayer.utils';

export class RelayerRepository {
  private readonly logger = new Logger(RelayerRepository.name);

  constructor(
    @Inject(PersistentService) private readonly persistent: PersistentService,
  ) {}

  async getPendingSubmitTx() {
    return this.persistent.pgPool.transaction(async conn => {
      const txs_schema = m
        .database('indexer', 'txs')
        .merge(m.database('indexer', 'has_id'));
      const proof_schema = m.database('indexer', 'query_proofs');
      const txs_join_proof_schema = txs_schema.merge(
        z.object({
          proofs: z.array(proof_schema),
        }),
      );

      const isWhitelistEnabled = env().IS_WHITELIST_ENABLED;
      const tokenList = isWhitelistEnabled
        ? await getWhitelistBRC20TokensCached()
        : [];

      this.logger.debug(
        `whitelist token list: ${tokenList.length}, getting pending tx...`,
      );
      const pendingTxs = isWhitelistEnabled
        ? // get pending txs with whitelist token list
          await conn.query(SQL.type(txs_schema)`
          with pending_txs as (select *
                               from indexer.txs
                               where not exists (select 1
                                                 from indexer.submitted_tx
                                                 where txs.id = submitted_tx.id)
                                 and error is null
                                 and length(tx_hash) <= 4096
                                 and height >= ${
                                   env().RELAYER_MINIMAL_BLOCK_HEIGHT
                                 }
                               ),
               qualified_txs as (select pt.id, count(*)
                                 from pending_txs pt
                                          join indexer.proofs pf on pt.id = pf.id
                                 where tick = ANY(${SQL.array(
                                   tokenList,
                                   'text',
                                 )})
                                 group by 1
                                 having count(*) >=
                                        (select minimal_proof_count
                                         from indexer_config.relayer_configs
                                         limit 1)),
               qualified_txs_with_proof as (select *
                                            from qualified_txs
                                                     join pending_txs p on qualified_txs.id = p.id)

          select *
          from qualified_txs_with_proof
          order by height asc
          ;
      `)
        : // get pending txs without whitelist token list
          await conn.query(SQL.type(txs_schema)`
          with pending_txs as (select *
                               from indexer.txs
                               where not exists (select 1
                                                 from indexer.submitted_tx
                                                 where txs.id = submitted_tx.id)
                                 and error is null
                                 and length(tx_hash) <= 4096
                                 and height >= ${
                                   env().RELAYER_MINIMAL_BLOCK_HEIGHT
                                 }
                               ),
               qualified_txs as (select pt.id, count(*)
                                 from pending_txs pt
                                          join indexer.proofs pf on pt.id = pf.id
                                 group by 1
                                 having count(*) >=
                                        (select minimal_proof_count
                                         from indexer_config.relayer_configs
                                         limit 1)),
               qualified_txs_with_proof as (select *
                                            from qualified_txs
                                                     join pending_txs p on qualified_txs.id = p.id)

          select *
          from qualified_txs_with_proof
          order by height asc
          ;
      `);

      const shardPendingTxs = pendingTxs.rows.filter(tx =>
        shouldHandleForKey(tx.tx_id.toString('hex')),
      );

      this.logger.debug(
        `got pendingTxs: ${shardPendingTxs.length}/${pendingTxs.rows.length}, building proofs...`,
      );

      type ResultType = z.infer<typeof txs_join_proof_schema>;

      const results: ResultType[] = [];

      for (const tx of shardPendingTxs) {
        const proofs = await conn.many(SQL.type(proof_schema)`
          select *
          from indexer.proofs p
          where p.id = ${SQL.binary(tx.id)}
        `);
        results.push(
          txs_join_proof_schema.parse({
            ...tx,
            proofs,
          }),
        );
      }

      this.logger.verbose(`built tx with proofs: ${results.length}`);

      return results;
    });
  }

  async setAlreadyIndexed(
    params: { 'bitcoin-tx': Buffer; offset: bigint; output: bigint }[],
  ) {
    return this.persistent.pgPool.transaction(async conn => {
      for (const tx of params) {
        await conn.query(SQL.typeAlias('indexer_txs')`
        insert into indexer.submitted_tx (tx_hash,
                                          satpoint,
                                          output,
                                          stacks_tx_id,
                                          broadcast_result_type,
                                          error,
                                          submitted_by,
                                          submitter_nonce)
        VALUES (${SQL.binary(tx['bitcoin-tx'])},
                ${tx.offset.toString()},
                ${tx.output.toString()},
                null,
                'settled',
                null,
                ${env().STACKS_RELAYER_ACCOUNT_ADDRESS},
                -1)

        `);
      }
    });
  }

  async onRBFTx(params: {
    nonce: number;
    newTxId: Buffer;
    submitted_by: string;
  }) {
    return this.persistent.pgPool.transaction(async conn => {
      await conn.query(SQL.typeAlias('indexer_txs')`
        update indexer.submitted_tx
        set stacks_tx_id = ${SQL.binary(params.newTxId)}
        where submitted_by = ${params.submitted_by}
          and broadcast_result_type = 'ok'
          and submitter_nonce = ${params.nonce}
        `);
    });
  }

  async upsertSubmittedTx(params: ModelIndexer<'submitted_tx'>[]) {
    return this.persistent.pgPool.transaction(async conn => {
      for (const tx of params) {
        const existing = await conn.maybeOne(SQL.typeAlias(
          'indexer_submitted_tx',
        )`
          select *
          from indexer.submitted_tx
          where tx_hash = ${SQL.binary(tx.tx_hash)}
            and satpoint = ${tx.satpoint.toString()}
            and output = ${tx.output.toString()}
            `);
        if (existing != null) {
          if (
            existing.broadcast_result_type != tx.broadcast_result_type ||
            existing.stacks_tx_id != tx.stacks_tx_id ||
            existing.error != tx.error
          ) {
            await conn.query(SQL.typeAlias('indexer_submitted_tx')`
            update indexer.submitted_tx
            set stacks_tx_id = ${
              tx.stacks_tx_id == null ? null : SQL.binary(tx.stacks_tx_id)
            },
                submitter_nonce = COALESCE(${
                  tx.submitter_nonce?.toString() ?? null
                }, submitter_nonce),
                broadcast_result_type = ${tx.broadcast_result_type},
                error = ${tx.error ?? null}
            where tx_hash = ${SQL.binary(tx.tx_hash)}
              and satpoint = ${tx.satpoint.toString()}
              and output = ${tx.output.toString()}
            `);
          }
        } else {
          await conn.query(SQL.typeAlias('indexer_submitted_tx')`
          insert into indexer.submitted_tx (tx_hash,
                                            satpoint,
                                            output,
                                            stacks_tx_id,
                                            broadcast_result_type,
                                            error,
                                            submitted_by,
                                            submitter_nonce)
          VALUES (${SQL.binary(tx.tx_hash)},
                  ${tx.satpoint.toString()},
                  ${tx.output.toString()},
                  ${
                    tx.stacks_tx_id == null ? null : SQL.binary(tx.stacks_tx_id)
                  },
                  ${tx.broadcast_result_type},
                  ${tx.error ?? null},
                  ${tx.submitted_by ?? null},
                  ${tx.submitter_nonce?.toString() ?? 0}
                  )
        `);
        }
      }
    });
  }

  async setTxsWithError(
    txErrors: {
      tx_hash: Buffer;
      satpoint: bigint;
      output: bigint;
      error: string;
    }[],
  ) {
    await this.persistent.pgPool.transaction(async conn => {
      for (const tx of txErrors) {
        await conn.query(SQL.typeAlias('void')`
        update indexer.txs
        set error = ${tx.error}
        where tx_hash = ${SQL.binary(tx.tx_hash)}
          and satpoint = ${tx.satpoint.toString()}
          and output = ${tx.output.toString()}
        `);
      }
    });
  }
}
