import { SQL } from '@alex-b20/commons';

import { PersistentService } from '@alex-b20/persistent';
import { ModelIndexer } from '@alex-b20/types';
import { Inject, Logger } from '@nestjs/common';

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
             qualified_txs as (select target_txs.tx_id
                               from target_txs
                               having count(*) >=
                                      (select minimal_proof_count
                                       from indexer_config.relayer_configs
                                       limit 1
                                       )),
             with_proof as (select target_txs.*,
                                   proofs.type,
                                   proofs.order_hash,
                                   proofs.signer,
                                   proofs.signature
                            from target_txs
                                   join indexer.proofs on target_txs.id = proofs.id
                            where target_txs.tx_id in (select tx_id
                                                        from qualified_txs))
        select *
        from with_proof;
      `);
      this.logger.verbose(`getPendingSubmitTx: ${pendingTxs.rows.length}`);

      return pendingTxs;
    });
  }

  async upsertSubmittedTx(params: ModelIndexer<'submitted_tx'>[]) {
    return this.persistent.pgPool.transaction(async conn => {
      for (const tx of params) {
        await conn.query(SQL.typeAlias('indexer_submitted_tx')`
          insert into indexer.submitted_tx (tx_id,
                                            satpoint,
                                            output,
                                            stacks_tx_id,
                                            broadcast_result_type,
                                            error,
                                            submitted_by)
          VALUES (${SQL.binary(tx.tx_id)},
                  ${tx.satpoint.toString()},
                  ${tx.output.toString()},
                  ${
                    tx.stacks_tx_id == null ? null : SQL.binary(tx.stacks_tx_id)
                  },
                  ${tx.broadcast_result_type},
                  ${tx.error ?? null},
                  ${tx.submitted_by});
        `);
      }
    });
  }
}
