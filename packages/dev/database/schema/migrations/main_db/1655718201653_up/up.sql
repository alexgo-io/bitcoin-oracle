CREATE
  EXTENSION IF NOT EXISTS pgcrypto;

CREATE
  OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
  RETURNS TRIGGER AS
$$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$
  LANGUAGE plpgsql;

create schema if not exists indexer;
create table indexer.blocks
(
-- stacks height
  "height"     integer     not null,
  "header"     bytea       not null unique,
  "block_hash" bytea       not null,
  primary key ("height", "header"),
  "canonical"  boolean     not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table indexer.txs
(
  "id"           bytea unique generated always as (digest(lower(encode(tx_hash, 'hex')) ||
                                                          ':' || cast(output as text) ||
                                                          ':' || cast(satpoint as text), 'sha256')) STORED,
  "tx_hash"      bytea       not null,
  "output"       integer     not null,
  "satpoint"     integer     not null,

  "tx_id"        bytea       not null,
  "from_address" text        not null,
  "to_address"   text        not null,

  "header"       bytea       not null,
-- bitcoin height
  "height"       integer     not null,
  "proof_hashes" bytea[]     not null,
  "tx_index"     integer     not null,
  "tree_depth"   integer     not null,
  "from"         bytea       not null,
  "to"           bytea       not null,
  "tick"         text        not null,
  "amt"          numeric     not null,
  "from_bal"     numeric     not null,
  "to_bal"       numeric     not null,
  "created_at"   timestamptz not null default now(),
  "updated_at"   timestamptz not null default now()
);
CREATE INDEX tx_height ON indexer.txs (height);

create table indexer.proofs
(
  "id"         bytea generated always as (digest(lower(encode(tx_hash, 'hex')) ||
                                                 ':' || cast(output as text) ||
                                                 ':' || cast(satpoint as text), 'sha256')) STORED,
  "tx_hash"    bytea       not null,
  "output"     integer     not null,
  "satpoint"   integer     not null,
  "from"       bytea       not null,
  "to"         bytea       not null,
  "tick"       text        not null,
  "amt"        numeric     not null,
  "from_bal"   numeric     not null,
  "to_bal"     numeric     not null,

  "type"       text        not null,
  "order_hash" bytea       not null,
  "signature"  bytea       not null,
  "signer"     text        not null,
  unique ("order_hash", "signature", "signer"),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);
CREATE INDEX proof_order_hash ON indexer.proofs (order_hash);

create table indexer.submitted_tx
(
  "id"                    bytea generated always as (digest(lower(encode(tx_hash, 'hex')) ||
                                                            ':' || cast(output as text) ||
                                                            ':' || cast(satpoint as text), 'sha256')) STORED,
  "tx_hash"               bytea       not null,
  "satpoint"              integer     not null,
  "output"                integer     not null,
  "stacks_tx_id"          bytea       null,
  "broadcast_result_type" text        not null,
  "error"                 text,
  "submitted_by"          text        not null,
  "submitter_nonce"       integer     not null,
  "submitted_at"          timestamptz not null default now(),
  "created_at"            timestamptz not null default now(),
  "updated_at"            timestamptz not null default now()
);

create schema indexer_config;
create table indexer_config.relayer_configs
(
  minimal_proof_count integer not null
);
insert into indexer_config.relayer_configs (minimal_proof_count)
values (1);
