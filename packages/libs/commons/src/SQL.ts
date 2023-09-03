import {
  IndexerBlockSchema,
  IndexerProofSchema,
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
  },
});
