alter table indexer.proofs
  add signer_pubkey bytea;

alter table indexer.proofs
  add height numeric;

create index proofs_idx_type_height
  on indexer.proofs (type, height desc);

