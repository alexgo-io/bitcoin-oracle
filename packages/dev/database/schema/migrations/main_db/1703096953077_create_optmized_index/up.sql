CREATE INDEX idx_proofs_id ON brc20_oracle_db.indexer.proofs (id);
CREATE INDEX idx_proofs_type ON brc20_oracle_db.indexer.proofs (type);
create index txs_tx_id_index
  on brc20_oracle_db.indexer.txs (tx_id);

