import { OTLP_Indexer } from '@bitcoin-oracle/instrument';
import {
  computeTxsId,
  SQL,
  stringifyJSON,
} from '@meta-protocols-oracle/commons';
import { PersistentService } from '@meta-protocols-oracle/persistent';
import { BufferStringSchema, m, ModelOf } from '@meta-protocols-oracle/types';
import { Inject, Logger } from '@nestjs/common';
import assert from 'assert';
import { DatabaseTransactionConnection } from 'slonik';
import { env } from '../env';

export class MetaIndexerRepository {
  private readonly logger = new Logger(MetaIndexerRepository.name);
  private lastProcessedHeight = -1;
  constructor(
    @Inject(PersistentService)
    private readonly persistent: PersistentService,
  ) {
    OTLP_Indexer().gauge['last-height'].addCallback(result => {
      result.observe(this.lastProcessedHeight);
    });
  }

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
                                                           signatures,
                                                           proof_hashes,
                                                           tx_index,
                                                           tree_depth,
                                                           height)
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
                ${SQL.array(tx.signatures, 'bytea')},
                ${SQL.array(tx.proof_hashes, 'bytea')},
                ${tx.tx_index.toString(10)},
                ${tx.tree_depth.toString(10)},
                ${tx.height.toString(10)})

        returning *;
    `);
    OTLP_Indexer().counter['insert-validated-tx'].add(1);

    this.logger.verbose(`inserted validated_txs: ${rs.tx_id.toString('hex')}`);

    for (let i = 0; i < tx.signatures.length; i++) {
      const signature = tx.signatures[i];
      const signer_type = tx.signer_types[i];
      OTLP_Indexer().counter['insert-validated-proof'](signer_type).add(1);

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

    this.lastProcessedHeight = Number(tx.height);
  }

  async process(option: { size: number }) {
    for (;;) {
      const processed = await this.persistent.pgPool.transaction(async conn => {
        return await this.processPendingProofs(conn, option);
      });
      if (processed === 0) {
        break;
      }
    }
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

      const id = computeTxsId(
        proof.tx_hash,
        proof.satpoint.toString(10),
        proof.output.toString(10),
      );
      const txRs = await conn.query(SQL.type(m.database('indexer', 'txs'))`
        SELECT *
        FROM brc20_oracle_db.indexer.txs
        WHERE id = ${SQL.binary(id)}
      `);
      if (txRs.rows.length !== 1) {
        this.logger.error(
          `found ${txRs.rows.length} txs for id: ${id.toString(
            'hex',
          )}, tx_id: ${proof.tx_id.toString(
            'hex',
          )} order_hash: ${proof.order_hash.toString('hex')}
          satpoint; ${proof.satpoint.toString(
            10,
          )}, output: ${proof.output.toString(10)}, proof count: ${
            proofs.length
          }, tx_hash: ${proof.tx_hash.toString('hex')}`,
        );
        // this.logger.error(
        //   `failed to get tx of id: ${id.toString('hex')}, returns rows ${
        //     txRs.rows.length
        //   }, tx_id: ${proof.tx_id.toString(
        //     'hex',
        //   )}, satpoint; ${proof.satpoint.toString(
        //     10,
        //   )}, output: ${proof.output.toString(10)}`,
        // );
        //
        // // TODO: set to throw error after data is stable
        // const removed = await conn.query(SQL.type(
        //   m.database('indexer', 'proofs'),
        // )`
        //   DELETE FROM brc20_oracle_db.indexer.proofs
        //   WHERE order_hash = ${SQL.binary(proof.order_hash)}
        //   and satpoint = ${proof.satpoint.toString(10)}
        //   and output = ${proof.output.toString(10)}
        // `);
        // this.logger.error(
        //   `removed ${
        //     removed.rowCount
        //   } proofs, order_hash: ${proof.order_hash.toString(
        //     'hex',
        //   )}, satpoint; ${proof.satpoint.toString(
        //     10,
        //   )}, output: ${proof.output.toString(10)}`,
        // );

        continue;
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
        proof_hashes: tx.proof_hashes,
        tx_index: tx.tx_index,
        tree_depth: tx.tree_depth,
        height: tx.height,
        // signatures
        signers: proofs.map(p => p.signer),
        signer_types: proofs.map(p => p.type),
        signatures: proofs.map(p => p.signature),
        // additional
        tx_id: tx.tx_id,
      });
    }

    for (const tx of validatedTxs) {
      await this.insertValidatedTx(conn, tx);
    }
    this.logger.verbose(`inserted ${validatedTxs.length} validated txs`);

    return validatedTxs.length;
  }
}
