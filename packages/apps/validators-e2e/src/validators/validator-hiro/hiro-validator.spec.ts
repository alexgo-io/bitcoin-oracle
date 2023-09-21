/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getHiroTxOnBlock$,
  getIndexerTxOnBlock$,
  processBlock$,
} from '@alex-b20/validator-hiro';

jest.mock('@alex-b20/api-client', () => {
  return {
    indexer: () => {
      return {
        txs: () => {
          return {
            post: (tx: any) => {
              return tx;
            },
          };
        },
      };
    },
  };
});

describe('libs-validator-hiro', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should getTxOnBlock', done => {
    const txs: any[] = [];
    getHiroTxOnBlock$(802396).subscribe({
      next: tx => {
        txs.push(tx as any);
      },
      complete: () => {
        expect(
          txs.sort((a, b) => a.inscription_id.localeCompare(b.inscription_id)),
        ).toMatchInlineSnapshot(`
[
  {
    "address": "51206d683127950387dfe969180efae24ff49fd426c8ee1281897a287da4553d10aa",
    "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
    "block_height": 802396,
    "from_bal": "0",
    "inscription_id": "32f81c2bdd4e59b343f153f04103af4674f70839c16611bd182e74c9d5a6308ci0",
    "location": {
      "satpoint": 0n,
      "tx_id": "662e0e548fd612d6fbe5346906e0495aabfb6b817cb1db3a25a710a02f8a9cb6",
      "vout": 0n,
    },
    "operation": "transfer_send",
    "ticker": "odit",
    "timestamp": 1691596076000,
    "to_bal": "0",
    "transfer_send": {
      "amount": 1000000000000000000000n,
      "from_address": "5120c5765f9d1b962eca956cce5e22908dce30a11f7ce91eefb9140592d704524871",
      "to_address": "51206d683127950387dfe969180efae24ff49fd426c8ee1281897a287da4553d10aa",
    },
    "tx_id": "662e0e548fd612d6fbe5346906e0495aabfb6b817cb1db3a25a710a02f8a9cb6",
  },
  {
    "address": "0014cfeb63d2ceaa84ccf6989c86791ff8cee714d1cd",
    "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
    "block_height": 802396,
    "from_bal": "0",
    "inscription_id": "62963adf80becaaa3d9c1628fe1836a028045783d3d8474bff4692185e243448i0",
    "location": {
      "satpoint": 0n,
      "tx_id": "f12a86200a231710a3c63aae12149cb50c6474658320d25156a0307877e0bf2c",
      "vout": 1n,
    },
    "operation": "transfer_send",
    "ticker": "LGER",
    "timestamp": 1691596076000,
    "to_bal": "0",
    "transfer_send": {
      "amount": 1160000000000000000000n,
      "from_address": "5120de39913a8c81184c95f838532d6e0ec0974a2128da6e8e90a6c2adc4f3338af5",
      "to_address": "0014cfeb63d2ceaa84ccf6989c86791ff8cee714d1cd",
    },
    "tx_id": "f12a86200a231710a3c63aae12149cb50c6474658320d25156a0307877e0bf2c",
  },
  {
    "address": "0014ad42179475826f3cae94c1c3bae2797c6933a53a",
    "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
    "block_height": 802396,
    "from_bal": "0",
    "inscription_id": "6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666ai0",
    "location": {
      "satpoint": 0n,
      "tx_id": "da30e16bda726bee66f94d2872a90350c29b08bca01ad8070e4ccb06112a0b8a",
      "vout": 1n,
    },
    "operation": "transfer_send",
    "ticker": "RDEX",
    "timestamp": 1691596076000,
    "to_bal": "0",
    "transfer_send": {
      "amount": 10000000000000000000000n,
      "from_address": "0014870dba15d6b5a0563b6df472359a7ef75d21f26c",
      "to_address": "0014ad42179475826f3cae94c1c3bae2797c6933a53a",
    },
    "tx_id": "da30e16bda726bee66f94d2872a90350c29b08bca01ad8070e4ccb06112a0b8a",
  },
  {
    "address": "0014bb3909d5ca626d1ef5d1c330ae7d706bf2158733",
    "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
    "block_height": 802396,
    "from_bal": "0",
    "inscription_id": "c0e5791998791f64d16fd7d546aacfdc27319ea6d090529e99edcca7f1381c38i0",
    "location": {
      "satpoint": 0n,
      "tx_id": "dc5307885a28ee5f4ca950fd1f024d50480d0dc77c5ea5c057bcdccff1384a6e",
      "vout": 1n,
    },
    "operation": "transfer_send",
    "ticker": "trac",
    "timestamp": 1691596076000,
    "to_bal": "0",
    "transfer_send": {
      "amount": 500000000000000000000n,
      "from_address": "5120e356def0ceb8eb92fc91c2ef40a112de8d949fd578286efbd2e2805a6d99c3c3",
      "to_address": "0014bb3909d5ca626d1ef5d1c330ae7d706bf2158733",
    },
    "tx_id": "dc5307885a28ee5f4ca950fd1f024d50480d0dc77c5ea5c057bcdccff1384a6e",
  },
]
`);
        done();
      },
    });
  }, 20e3);

  it.skip('should getIndexerTxOnBlock', done => {
    const txs: { id: string }[] = [];
    getIndexerTxOnBlock$(802396).subscribe({
      next: tx => {
        txs.push(tx as any);
      },
      complete: () => {
        expect(
          txs.sort((a, b) => Number(a.id) - Number(b.id)),
        ).toMatchInlineSnapshot();
        done();
      },
    });
  }, 30e3);

  it.skip('should processIndexerTxOnBlock', done => {
    const txs: any[] = [];
    processBlock$(802396).subscribe({
      next: val => {
        txs.push(val);
      },
      complete: () => {
        expect(txs).toMatchInlineSnapshot();
        done();
      },
    });
  }, 15e3);
});
