/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getActivityOnBlock,
  getAllActivitiesOnBlock$,
  getBalanceOnBlock,
} from '@alex-b20/validator-hiro';

describe('Hiro API', function () {
  it('should get activity', async function () {
    const data = await getActivityOnBlock(802396, 0, 2);
    expect(data).toBeDefined();
    expect(
      (data as any).results.sort((a: any, b: any) =>
        a.inscription_id.localeCompare(b.inscription_id),
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "bc1pd45rzfu4qwral6tfrq804cj07j0agfkgacfgrzt69p76g4fazz4qdwzpww",
          "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
          "block_height": 802396,
          "inscription_id": "32f81c2bdd4e59b343f153f04103af4674f70839c16611bd182e74c9d5a6308ci0",
          "location": "662e0e548fd612d6fbe5346906e0495aabfb6b817cb1db3a25a710a02f8a9cb6:0:0",
          "operation": "transfer_send",
          "ticker": "odit",
          "timestamp": 1691596076000,
          "transfer_send": {
            "amount": "1000.000000000000000000",
            "from_address": "bc1pc4m9l8gmjchv49tvee0z9yydecc2z8muay0wlwg5qkfdwpzjfpcsxuw69j",
            "to_address": "bc1pd45rzfu4qwral6tfrq804cj07j0agfkgacfgrzt69p76g4fazz4qdwzpww",
          },
          "tx_id": "662e0e548fd612d6fbe5346906e0495aabfb6b817cb1db3a25a710a02f8a9cb6",
        },
        {
          "address": "bc1qel4k85kw42zvea5cnjr8j8lcemn3f5wdpmujsc",
          "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
          "block_height": 802396,
          "inscription_id": "62963adf80becaaa3d9c1628fe1836a028045783d3d8474bff4692185e243448i0",
          "location": "f12a86200a231710a3c63aae12149cb50c6474658320d25156a0307877e0bf2c:1:0",
          "operation": "transfer_send",
          "ticker": "LGER",
          "timestamp": 1691596076000,
          "transfer_send": {
            "amount": "1160.000000000000000000",
            "from_address": "bc1pmcuezw5vsyvye90c8pfj6mswczt55gfgmfhgay9xc2kufuen3t6s6j0hpu",
            "to_address": "bc1qel4k85kw42zvea5cnjr8j8lcemn3f5wdpmujsc",
          },
          "tx_id": "f12a86200a231710a3c63aae12149cb50c6474658320d25156a0307877e0bf2c",
        },
      ]
    `);
  }, 10e3);

  it('should get activity match schema', function (done) {
    getAllActivitiesOnBlock$(802396, 2, 6).subscribe(value => {
      expect(
        (value as any).sort((a: any, b: any) =>
          a.inscription_id.localeCompare(b.inscription_id),
        ),
      ).toMatchInlineSnapshot(`
        [
          {
            "address": "51206d683127950387dfe969180efae24ff49fd426c8ee1281897a287da4553d10aa",
            "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
            "block_height": 802396,
            "inscription_id": "32f81c2bdd4e59b343f153f04103af4674f70839c16611bd182e74c9d5a6308ci0",
            "location": {
              "satpoint": 0n,
              "tx_id": "662e0e548fd612d6fbe5346906e0495aabfb6b817cb1db3a25a710a02f8a9cb6",
              "vout": 0n,
            },
            "operation": "transfer_send",
            "ticker": "odit",
            "timestamp": 1691596076000,
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
            "inscription_id": "62963adf80becaaa3d9c1628fe1836a028045783d3d8474bff4692185e243448i0",
            "location": {
              "satpoint": 0n,
              "tx_id": "f12a86200a231710a3c63aae12149cb50c6474658320d25156a0307877e0bf2c",
              "vout": 1n,
            },
            "operation": "transfer_send",
            "ticker": "LGER",
            "timestamp": 1691596076000,
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
            "inscription_id": "6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666ai0",
            "location": {
              "satpoint": 0n,
              "tx_id": "da30e16bda726bee66f94d2872a90350c29b08bca01ad8070e4ccb06112a0b8a",
              "vout": 1n,
            },
            "operation": "transfer_send",
            "ticker": "RDEX",
            "timestamp": 1691596076000,
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
            "inscription_id": "c0e5791998791f64d16fd7d546aacfdc27319ea6d090529e99edcca7f1381c38i0",
            "location": {
              "satpoint": 0n,
              "tx_id": "dc5307885a28ee5f4ca950fd1f024d50480d0dc77c5ea5c057bcdccff1384a6e",
              "vout": 1n,
            },
            "operation": "transfer_send",
            "ticker": "trac",
            "timestamp": 1691596076000,
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
    });
  }, 10e3);

  it('should get balance', async function () {
    const data = await getBalanceOnBlock(
      'bc1p92dh94w90gf4yqvza2c2jywwyxwupg9skfl5e7qqkd6ylk28fqhqmwhks4',
      807573,
    );

    expect(data).toBeDefined();
    expect(data).toMatchInlineSnapshot(`
      {
        "limit": 60,
        "offset": 0,
        "results": [
          {
            "available_balance": "500.000000000000000000",
            "overall_balance": "500.000000000000000000",
            "ticker": "BTOC",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "121000.000000000000000000",
            "overall_balance": "121000.000000000000000000",
            "ticker": "FHAL",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "0.000000000000000000",
            "overall_balance": "100000.000000000000000000",
            "ticker": "gmgn",
            "transferrable_balance": "100000.000000000000000000",
          },
          {
            "available_balance": "136250.000000000000000000",
            "overall_balance": "200000.000000000000000000",
            "ticker": "mars",
            "transferrable_balance": "63750.000000000000000000",
          },
          {
            "available_balance": "850000.000000000000000000",
            "overall_balance": "850000.000000000000000000",
            "ticker": "OBJT",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "67000.000000000000000000",
            "overall_balance": "67000.000000000000000000",
            "ticker": "ODSR",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "189000.000000000000000000",
            "overall_balance": "189000.000000000000000000",
            "ticker": "OMNI",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "1200.000000000000000000",
            "overall_balance": "1200.000000000000000000",
            "ticker": "ORPR",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "202000.000000000000000000",
            "overall_balance": "202000.000000000000000000",
            "ticker": "rssc",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "3315599995981.000000000000000000",
            "overall_balance": "3315599995981.000000000000000000",
            "ticker": "sats",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "48000.000000000000000000",
            "overall_balance": "48000.000000000000000000",
            "ticker": "time",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "2.000000000000000000",
            "overall_balance": "2.000000000000000000",
            "ticker": "usdt",
            "transferrable_balance": "0.000000000000000000",
          },
          {
            "available_balance": "333600.000000000000000000",
            "overall_balance": "452400.000000000000000000",
            "ticker": "WOLV",
            "transferrable_balance": "118800.000000000000000000",
          },
          {
            "available_balance": "201200.000000000000000000",
            "overall_balance": "225500.000000000000000000",
            "ticker": "wzrd",
            "transferrable_balance": "24300.000000000000000000",
          },
        ],
        "total": 14,
      }
    `);
  });
});
