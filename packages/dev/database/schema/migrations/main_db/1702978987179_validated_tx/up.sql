create table indexer.validated_txs
(
  "id"           bytea unique generated always as (digest(lower(encode(tx_hash, 'hex')) ||
                                                          ':' || (lower(encode(order_hash, 'hex'))
                                                            ), 'sha256')) STORED,
--   unique key pair (tx_hash, output, satpoint, order_hash),
  "tx_hash"      bytea       not null,

  "order_hash"   bytea       not null,
--   order_hash component
  "amt"          numeric     not null,
  "bitcoin_tx"   bytea       not null,
  "decimals"     integer     not null,
  "from"         bytea       not null,
  "from_bal"     numeric     not null,
  "offset"       integer     not null,
  "output"       integer     not null,
  "tick"         text        not null,
  "to"           bytea       not null,
  "to_bal"       numeric     not null,

--   additional_info
  "tx_id"        bytea       not null,


  "signers"      text[]      not null,
  "signer_types" text[]      not null,
  "signatures"   bytea[]     not null,
  "created_at"   timestamptz not null default now(),
  "updated_at"   timestamptz not null default now()
);

alter table indexer.proofs
  add validated bool default false;

CREATE INDEX proof_order_signature ON indexer.proofs (signature);
CREATE INDEX idx_proofs_validated ON indexer.proofs(validated);
CREATE INDEX idx_proofs_order_hash_signer ON indexer.proofs(order_hash, signer);
DROP INDEX indexer.proof_order_hash;
