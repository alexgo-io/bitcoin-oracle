drop table if exists indexer.validated_txs;
create table indexer.validated_txs
(
  id             bytea generated always as (digest(
    ((((lower(encode(tx_hash, 'hex'::text)) || ':'::text) || (output)::text) || ':'::text) || ("offset")::text),
    'sha256'::text)) stored,
  "id2"          bytea unique generated always as (digest(lower(encode(tx_hash, 'hex')) ||
                                                          ':' || (lower(encode(order_hash, 'hex'))
                                                            ), 'sha256')) STORED,
-- unique key pair (tx_hash, output, satpoint, order_hash),
  "tx_hash"      bytea       not null,

  "order_hash"   bytea       not null,
-- order_hash component
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

-- verify component
  "proof_hashes" bytea[]     not null,
  "tx_index"     integer     not null,
  "tree_depth"   integer     not null,
-- additional_info
  "tx_id"        bytea       not null,
  "height"       integer     not null,


  "signers"      text[]      not null,
  "signer_types" text[]      not null,
  "signatures"   bytea[]     not null,
  "created_at"   timestamptz not null default now(),
  "updated_at"   timestamptz not null default now()
);

CREATE INDEX idx_validated_txs_id ON indexer.validated_txs (id);


alter table indexer.proofs
  add validated bool default false;

CREATE INDEX proof_order_signature ON indexer.proofs (signature);
CREATE INDEX idx_proofs_validated ON indexer.proofs (validated);
CREATE INDEX idx_proofs_order_hash_signer ON indexer.proofs (order_hash, signer);
DROP INDEX if exists indexer.proof_order_hash;

CREATE INDEX idx_validated_txs_to_updated_at
  ON indexer.validated_txs ("to", updated_at);
