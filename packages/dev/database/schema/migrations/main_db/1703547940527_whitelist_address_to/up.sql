create table brc20_oracle_db.indexer.whitelist_to_address
(
  address_to bytea not null unique
    constraint whitelist_to_address_pk
      primary key
);
insert into brc20_oracle_db.indexer.whitelist_to_address (address_to)
values ('\x51207e875ae46c9f2d28d8d302cfa8c045bfc94df9277dbdf2d7a1fcdba129731899');
insert into brc20_oracle_db.indexer.whitelist_to_address (address_to)
values ('\x001479ac6506320129ab574359a592dd8d191927b593');
