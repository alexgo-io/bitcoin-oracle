DROP INDEX indexer.proofs_idx_type_height;
ALTER TABLE indexer.proofs DROP COLUMN height;
ALTER TABLE indexer.proofs DROP COLUMN signer_pubkey;
