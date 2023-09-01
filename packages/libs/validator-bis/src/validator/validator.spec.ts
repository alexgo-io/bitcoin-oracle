/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBisTxOnBlock } from './validator';

describe('libs-validator-bis', () => {
  it('should getIndexerTxOnBlock', done => {
    const txs: { id: string }[] = [];
    getBisTxOnBlock(802396).subscribe({
      next: tx => {
        txs.push(tx as any);
      },
      complete: () => {
        expect(txs.sort((a, b) => Number(a.id) - Number(b.id)))
          .toMatchInlineSnapshot(`
[
  {
    "activity_type": "transfer-transfer",
    "amount": "10000000000000000000000",
    "from_bal": "10868000000000000000000000",
    "id": 28093931,
    "inscription_id": "6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666ai0",
    "new_pkscript": "0014ad42179475826f3cae94c1c3bae2797c6933a53a",
    "new_satpoint": "da30e16bda726bee66f94d2872a90350c29b08bca01ad8070e4ccb06112a0b8a:1:0",
    "new_wallet": "bc1q44pp09r4sfhnet55c8pm4cne035n8ff6t0lhgz",
    "old_pkscript": "0014870dba15d6b5a0563b6df472359a7ef75d21f26c",
    "old_satpoint": "6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666a:0:0",
    "old_wallet": "bc1qsuxm59wkkks9vwmd73ertxn77awjrunv8x0nv6",
    "tick": "rdex",
    "to_bal": "10000000000000000000000",
  },
  {
    "activity_type": "transfer-transfer",
    "amount": "500000000000000000000",
    "from_bal": "17500000000000000000000",
    "id": 28093996,
    "inscription_id": "c0e5791998791f64d16fd7d546aacfdc27319ea6d090529e99edcca7f1381c38i0",
    "new_pkscript": "0014bb3909d5ca626d1ef5d1c330ae7d706bf2158733",
    "new_satpoint": "dc5307885a28ee5f4ca950fd1f024d50480d0dc77c5ea5c057bcdccff1384a6e:1:0",
    "new_wallet": "bc1qhvusn4w2vfk3aaw3cvc2ultsd0eptpennlxh87",
    "old_pkscript": "5120e356def0ceb8eb92fc91c2ef40a112de8d949fd578286efbd2e2805a6d99c3c3",
    "old_satpoint": "c0e5791998791f64d16fd7d546aacfdc27319ea6d090529e99edcca7f1381c38:0:0",
    "old_wallet": "bc1pudtdauxwhr4e9ly3cth5pggjm6xef8740q5xa77ju2q95mvec0psasgw6u",
    "tick": "trac",
    "to_bal": "1500000000000000000000",
  },
  {
    "activity_type": "transfer-transfer",
    "amount": "1160000000000000000000",
    "from_bal": "0",
    "id": 28094180,
    "inscription_id": "62963adf80becaaa3d9c1628fe1836a028045783d3d8474bff4692185e243448i0",
    "new_pkscript": "0014cfeb63d2ceaa84ccf6989c86791ff8cee714d1cd",
    "new_satpoint": "f12a86200a231710a3c63aae12149cb50c6474658320d25156a0307877e0bf2c:1:0",
    "new_wallet": "bc1qel4k85kw42zvea5cnjr8j8lcemn3f5wdpmujsc",
    "old_pkscript": "5120de39913a8c81184c95f838532d6e0ec0974a2128da6e8e90a6c2adc4f3338af5",
    "old_satpoint": "62963adf80becaaa3d9c1628fe1836a028045783d3d8474bff4692185e243448:0:0",
    "old_wallet": "bc1pmcuezw5vsyvye90c8pfj6mswczt55gfgmfhgay9xc2kufuen3t6s6j0hpu",
    "tick": "lger",
    "to_bal": "1160000000000000000000",
  },
  {
    "activity_type": "transfer-transfer",
    "amount": "1000000000000000000000",
    "from_bal": "14535000000000000000000000",
    "id": 28094263,
    "inscription_id": "32f81c2bdd4e59b343f153f04103af4674f70839c16611bd182e74c9d5a6308ci0",
    "new_pkscript": "51206d683127950387dfe969180efae24ff49fd426c8ee1281897a287da4553d10aa",
    "new_satpoint": "662e0e548fd612d6fbe5346906e0495aabfb6b817cb1db3a25a710a02f8a9cb6:0:0",
    "new_wallet": "bc1pd45rzfu4qwral6tfrq804cj07j0agfkgacfgrzt69p76g4fazz4qdwzpww",
    "old_pkscript": "5120c5765f9d1b962eca956cce5e22908dce30a11f7ce91eefb9140592d704524871",
    "old_satpoint": "32f81c2bdd4e59b343f153f04103af4674f70839c16611bd182e74c9d5a6308c:0:0",
    "old_wallet": "bc1pc4m9l8gmjchv49tvee0z9yydecc2z8muay0wlwg5qkfdwpzjfpcsxuw69j",
    "tick": "odit",
    "to_bal": "1000000000000000000000",
  },
]
`);
        done();
      },
    });
  }, 15000);
});
