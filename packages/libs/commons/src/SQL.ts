import {
  IndexerBlockSchema,
  IndexerProofSchema,
  IndexerSubmittedTxSchema,
  IndexerTxSchema,
} from '@alex-b20/types';
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
    indexer_txs: IndexerTxSchema,
    indexer_proof: IndexerProofSchema,
    indexer_block: IndexerBlockSchema,
    indexer_txs_proof: IndexerTxSchema.merge(IndexerProofSchema),
    indexer_submitted_tx: IndexerSubmittedTxSchema,
  },
});
