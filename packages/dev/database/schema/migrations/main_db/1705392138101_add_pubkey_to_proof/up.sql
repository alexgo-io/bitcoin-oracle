alter table indexer.proofs
  add signer_pubkey bytea;

alter table indexer.proofs
  add height numeric;

create index proofs_idx_type_height
  on indexer.proofs (type, height desc);


update indexer.proofs
   set signer_pubkey =  '\x02883d08893252a59cf25aafffe1417bf74a7526621665a4bc0060e4aa95405891'
 where signer = 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217';

update indexer.proofs
set signer_pubkey =  '\x0255966348dacd748595af0439e0a1cc947b2e3dc090acd8f90c32c30c3099b0a0'
where signer = 'SP35D14R1JB3KHE4D55MMN646GFZJ198B7FMBG5PD';

update indexer.proofs
set signer_pubkey =  '\x03c1a83abd5a199cb502818a110e2d55f67aae0e894f776c189b9f73556f8402a9'
where signer = 'SP3ZCGVGSQWT6TJAXZRXHCYA6SWGNSNGKHSYA1F2Q';

alter table indexer.proofs
  alter column signer_pubkey set not null;

UPDATE indexer.proofs pf
SET height = indexer.txs.height
FROM indexer.txs
WHERE pf.id = txs.id;

alter table indexer.proofs
  alter column height set not null;

update indexer.proofs
set validated = false;
