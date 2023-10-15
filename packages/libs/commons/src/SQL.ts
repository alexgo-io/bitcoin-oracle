import { m } from '@meta-protocols-oracle/types';
import { createSqlTag } from 'slonik';
import z from 'zod';

export const SQL = createSqlTag({
  typeAliases: {
    id: z.object({
      id: z.number(),
    }),
    void: z.object({}).strict(),
    any: z.any(),
    tx_id: z.object({
      tx_id: z.string(),
    }),
    indexer_txs: m.database('indexer', 'txs'),
    indexer_proof: m.database('indexer', 'proofs'),
    indexer_block: m.database('indexer', 'blocks'),
    indexer_txs_proof: m.database('indexer', 'tx_with_proofs'),
    indexer_submitted_tx: m.database('indexer', 'submitted_tx'),
  },
});
