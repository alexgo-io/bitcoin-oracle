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
-- create table indexer.blocks
-- (
-- -- stacks height
--     "height"     integer     not null,
--     "header"     bytea       not null unique,
--     primary key ("height", "header"),
--     "canonical"  boolean     not null,
--     "created_at" timestamptz not null default now(),
--     "updated_at" timestamptz not null default now()
-- );

create table indexer.txs
(
    "type"         text        not null,
    "header"       bytea       not null,
-- stacks height
    "height"       integer     not null,
    "tx_id"        bytea       not null,
    "proof_hashes" bytea[]     not null,
    "tx_index"     integer     not null,
    "tree_depth"   integer     not null,
    "from"         bytea       not null,
    "to"           bytea       not null,
    "output"       integer     not null,
    "tick"         text        not null,
    "amt"          numeric     not null,
    "bitcoin_tx"   bytea       not null,
    "from_bal"     numeric     not null,
    "to_bal"       numeric     not null,
    "created_at"   timestamptz not null default now(),
    unique ("header", "tx_id", "output"),
    "updated_at"   timestamptz not null default now()
);
CREATE INDEX tx_height ON indexer.txs (height);

create table indexer.proofs
(
    "type"       text        not null,
    "order_hash" bytea       not null,
    "signature"  bytea       not null,
    "signer"     text        not null,
    unique ("order_hash", "signature", "signer"),
    "created_at" timestamptz not null default now(),
    "updated_at" timestamptz not null default now()
);
CREATE INDEX proof_order_hash ON indexer.proofs (order_hash);

