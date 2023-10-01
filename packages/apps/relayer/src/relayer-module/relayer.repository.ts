import { SQL } from '@bitcoin-oracle/commons';

import { PersistentService } from '@bitcoin-oracle/persistent';
import { ModelIndexer } from '@bitcoin-oracle/types';
import { Inject, Logger } from '@nestjs/common';
import { env } from '../env';

export class RelayerRepository {
  private readonly logger = new Logger(RelayerRepository.name);

  constructor(
    @Inject(PersistentService) private readonly persistent: PersistentService,
  ) {}

  async getPendingSubmitTx() {
    return this.persistent.pgPool.transaction(async conn => {
      const pendingTxs = await conn.query(SQL.typeAlias('indexer_txs_proof')`
        with target_txs as (select *
                            from indexer.txs
                            where not exists (select 1
                                              from indexer.submitted_tx
                                              where txs.id = submitted_tx.id)),
             qualified_txs as (select target_txs.tx_hash, count(*)
                               from target_txs
                               group by target_txs.tx_hash
                               having count(*) >=
                                      (select minimal_proof_count
                                       from indexer_config.relayer_configs
                                       limit 1
                                       )
                               ),
             with_proof as (select target_txs.*,
                                   proofs.type,
                                   proofs.order_hash,
                                   proofs.signer,
                                   proofs.signature
                            from target_txs
                                   join indexer.proofs on target_txs.id = proofs.id
                            where target_txs.tx_hash in (select tx_hash
                                                        from qualified_txs)
                              and length(target_txs.tx_hash) <= 4096)
        select *
        from with_proof
        limit 2000
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
                                          submitted_by)
        VALUES (${SQL.binary(tx['bitcoin-tx'])},
                ${tx.offset.toString()},
                ${tx.output.toString()},
                null,
                'settled',
                null,
                ${env().STACKS_RELAYER_ACCOUNT_ADDRESS})

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
                                            submitted_by)
          VALUES (${SQL.binary(tx.tx_hash)},
                  ${tx.satpoint.toString()},
                  ${tx.output.toString()},
                  ${
                    tx.stacks_tx_id == null ? null : SQL.binary(tx.stacks_tx_id)
                  },
                  ${tx.broadcast_result_type},
                  ${tx.error ?? null},
                  ${tx.submitted_by ?? null})
        `);
        }
      }
    });
  }
}
