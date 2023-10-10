import { SQL } from '@bitcoin-oracle/commons';

import { PersistentService } from '@bitcoin-oracle/persistent';
import { m, ModelIndexer } from '@bitcoin-oracle/types';
import { Inject, Logger } from '@nestjs/common';
import { env } from '../env';

export class RelayerRepository {
  private readonly logger = new Logger(RelayerRepository.name);

  constructor(
    @Inject(PersistentService) private readonly persistent: PersistentService,
  ) {}

  async getPendingSubmitTx() {
    return this.persistent.pgPool.transaction(async conn => {
      const pendingTxs = await conn.query(SQL.type(
        m.database('indexer', 'relayer_txs'),
      )`
          with pending_txs as (select *
                               from indexer.txs
                               where not exists (select 1
                                                 from indexer.submitted_tx
                                                 where txs.id = submitted_tx.id)
                                 and error is null
                                 and length(tx_hash) <= 4096),
               qualified_txs as (select pt.id, count(*)
                                 from pending_txs pt
                                          join indexer.proofs pf on pt.id = pf.id
                                 group by 1
                                 having count(*) >=
                                        (select minimal_proof_count
                                         from indexer_config.relayer_configs
                                         limit 1)),
               bundle_proof as (select qt.id,
                                       json_agg(json_build_object('type', pf.type,
                                                                  'order_hash', pf.order_hash,
                                                                  'signer', pf.signer,
                                                                  'signature', pf.signature,
                                                                  'amt', pf.amt,
                                                                  'from', pf.from,
                                                                  'from_bal', pf.from_bal,
                                                                  'satpoint', pf.satpoint,
                                                                  'output', pf.output,
                                                                  'tick', pf.tick,
                                                                  'to', pf.to,
                                                                  'to_bal', pf.to_bal,
                                                                  'tx_id', pf.tx_id,
                                           )) as proofs
                                from qualified_txs qt
                                         join indexer.proofs pf on qt.id = pf.id
                                group by 1),
               with_proof as (select pt.*,
                                     bp.proofs
                              from bundle_proof bp
                                       join pending_txs pt on bp.id = pt.id)
          select *
          from with_proof
          ;
      `);
      this.logger.verbose(`getPendingSubmitTx: ${pendingTxs.rows.length}`);

      return pendingTxs;
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
