import { SQL, stringifyJSON } from '@meta-protocols-oracle/commons';
import { PersistentService } from '@meta-protocols-oracle/persistent';
import { BufferStringSchema, ModelOf, m } from '@meta-protocols-oracle/types';
import { Inject, Logger } from '@nestjs/common';
import assert from 'assert';
import { DatabaseTransactionConnection } from 'slonik';
import { env } from '../env';

export class MetaIndexerRepository {
  private readonly logger = new Logger(MetaIndexerRepository.name);
  constructor(
    @Inject(PersistentService)
    private readonly persistent: PersistentService,
  ) {}

  async insertValidatedTx(
    conn: DatabaseTransactionConnection,
    tx: ModelOf<'indexer', 'validated_txs'>,
  ) {
    // make sure we have correct length of the signatures
    if (
      tx.signatures.length === 0 ||
      tx.signatures.length != tx.signers.length ||
      tx.signer_types.length != tx.signers.length
    ) {
      throw new Error('!invalid-signatures-fatal');
    }

    const rs = await conn.one(SQL.type(m.database('indexer', 'validated_txs'))`
          INSERT INTO brc20_oracle_db.indexer.validated_txs (tx_hash,
                                                             order_hash,
                                                             amt,
                                                             bitcoin_tx,
                                                             decimals,
                                                             "from",
                                                             from_bal,
                                                             "offset",
                                                             output,
                                                             tick,
                                                             "to",
                                                             to_bal,
                                                             tx_id,
                                                             signers,
                                                             signer_types,
                                                             signatures)
          VALUES (${SQL.binary(tx.tx_hash)},
                  ${SQL.binary(tx.order_hash)},
                  ${tx.amt.toString(10)},
                  ${SQL.binary(tx.bitcoin_tx)},
                  ${tx.decimals.toString(10)},
                  ${SQL.binary(tx.from)},
                  ${tx.from_bal.toString(10)},
                  ${tx.offset.toString(10)},
                  ${tx.output.toString(10)},
                  ${tx.tick},
                  ${SQL.binary(tx.to)},
                  ${tx.to_bal.toString(10)},
                  ${SQL.binary(tx.tx_id)},
                  ${SQL.array(tx.signers, 'text')},
                  ${SQL.array(tx.signer_types, 'text')},
                  ${SQL.array(tx.signatures, 'bytea')})
          returning *;
      `);

    this.logger.verbose(`inserted validated_txs: ${rs.tx_id}`);

    for (let i = 0; i < tx.signatures.length; i++) {
      const signature = tx.signatures[i];
      const updated = await conn.query(SQL.typeAlias('any')`
          UPDATE brc20_oracle_db.indexer.proofs
          set validated = true
            where signature = ${SQL.binary(signature)}
            and validated = false
          returning *;
         `);
      if (updated.rows.length !== 1) {
        this.logger.error(
          `failed to update proof, returns[${
            updated.rows.length
          }]: ${stringifyJSON(updated.rows)}`,
        );
        throw new Error('!invalid-signatures-validated-updates');
      }
    }
  }

  async updateValidatedTx(
    tx: Pick<
      ModelOf<'indexer', 'validated_txs'>,
      'order_hash' | 'signers' | 'signer_types' | 'signatures'
    >,
  ) {
    return await this.persistent.pgPool.transaction(async conn => {
      const rs = await conn.one(SQL.type(
        m.database('indexer', 'validated_txs'),
      )`
          UPDATE brc20_oracle_db.indexer.validated_txs
          SET order_hash = ${SQL.binary(tx.order_hash)},
              signers = ${SQL.array(tx.signers, 'text')},
              signer_types = ${SQL.array(tx.signer_types, 'text')},
              signatures = ${SQL.array(tx.signatures, 'bytea')}
          WHERE tx_id = ${SQL.binary(tx.order_hash)}
          returning *;
      `);

      for (let i = 0; i < tx.signatures.length; i++) {
        const signature = tx.signatures[i];
        const updated = await conn.query(SQL.typeAlias('any')`
          UPDATE brc20_oracle_db.indexer.proofs
          set validated = true
            where signature = ${SQL.binary(signature)}
          returning *;
         `);
        if (updated.rows.length !== 1) {
          this.logger.error(
            `failed to update proof, returns[${
              updated.rows.length
            }]: ${stringifyJSON(updated.rows)}`,
          );
          throw new Error('!invalid-signatures-validated-updates');
        }
      }

      this.logger.verbose(`updated validated_txs: ${rs.tx_id}`);
      return rs;
    });
  }

  async process(option: { size: number }) {
    await this.persistent.pgPool.transaction(async conn => {
      await this.processPendingProofs(conn, option);
    });
  }

  async processPendingProofs(
    conn: DatabaseTransactionConnection,
    option: { size: number },
  ) {
    const minimalProofs = env().RELAYER_MINIMAL_AGREEMENT_COUNT;

    const rs = await conn.query(SQL.type(m.database('indexer', 'proofs'))`
      SELECT p.*
      FROM brc20_oracle_db.indexer.proofs p
             JOIN (
        SELECT order_hash
        FROM brc20_oracle_db.indexer.proofs
        WHERE validated = false
        GROUP BY order_hash
        HAVING COUNT(DISTINCT signer) >= ${minimalProofs}
        LIMIT ${option.size}
      ) AS grouped_proofs ON p.order_hash = grouped_proofs.order_hash
      WHERE p.validated = false
      order by p.order_hash
    `);
    this.logger.verbose(`processing ${rs.rows.length} proofs`);

    const batch = new Map<string, ModelOf<'indexer', 'proofs'>[]>();
    for (const row of rs.rows) {
      const proofs = batch.get(BufferStringSchema.parse(row.order_hash));
      if (proofs) {
        proofs.push(row);
      } else {
        batch.set(row.order_hash.toString('hex'), [row]);
      }
    }

    const validatedTxs: ModelOf<'indexer', 'validated_txs'>[] = [];

    for (const proofs of batch.values()) {
      const proof = proofs[0];
      assert(proof, `first proof is null`);

      const txRs = await conn.query(SQL.type(m.database('indexer', 'txs'))`
        SELECT *
        FROM brc20_oracle_db.indexer.txs
        WHERE tx_hash = ${SQL.binary(proof.tx_hash)}
        and output = ${proof.output.toString(10)}
        and satpoint = ${proof.satpoint.toString(10)}
      `);
      if (txRs.rows.length !== 1) {
        this.logger.error(
          `failed to get tx, returns[${txRs.rows.length}]: ${stringifyJSON(
            txRs.rows,
          )}`,
        );
        throw new Error('!invalid-signatures-tx-not-found');
      }

      const tx = txRs.rows[0];

      validatedTxs.push({
        tx_hash: proof.tx_hash,
        order_hash: proof.order_hash,
        amt: proof.amt,
        bitcoin_tx: tx.header,
        decimals: proof.decimals,
        from: proof.from,
        from_bal: proof.from_bal,
        // note: rename
        offset: proof.satpoint,
        output: proof.output,
        tick: proof.tick,
        to: proof.to,
        to_bal: proof.to_bal,
        signers: proofs.map(p => p.signer),
        signer_types: proofs.map(p => p.type),
        signatures: proofs.map(p => p.signature),
        // additional
        tx_id: tx.tx_id,
      });
    }

    this.logger.verbose(`inserting ${validatedTxs.length} validated txs`);
    for (const tx of validatedTxs) {
      await this.insertValidatedTx(conn, tx);
    }
  }
}
