import { getActivityOnBlock, getBalanceOnBlock } from './bis-api';

describe('Hiro API', function () {
  it('should get activity', async function () {
    const data = await getActivityOnBlock(802396, 0, 2);
    expect(data).toBeDefined();
    expect(data).toMatchInlineSnapshot(`
      {
        "limit": 2,
        "offset": 0,
        "results": [
          {
            "address": "bc1pd45rzfu4qwral6tfrq804cj07j0agfkgacfgrzt69p76g4fazz4qdwzpww",
            "block_hash": "000000000000000000016c19462d5d28ba6a3cb0707260ff72a67e59048285d9",
            "block_height": 802396,
            "inscription_id": "32f81c2bdd4e59b343f153f04103af4674f70839c16611bd182e74c9d5a6308ci0",
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
        ],
        "total": 1,
      }
    `);
  });

  it('should get balance', async function () {
    const data = await getBalanceOnBlock(
      '0014ad42179475826f3cae94c1c3bae2797c6933a53a',
      802397,
    );

    expect(data).toBeDefined();
    expect(data).toMatchInlineSnapshot();
  });
});
