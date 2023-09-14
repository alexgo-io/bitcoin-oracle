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
            "address": "bc1p9y9ymk0859668sse3t00esxlz0dg57299xt8nhpnpyp9yvz3z90q7up7ee",
            "block_hash": "0000000000000000000190e82594c49831e64782f42e7c2306b90d0338f9762b",
            "block_height": 807575,
            "inscription_id": "1d726983f12fdbf464b8c066f3cad07f4a0f0b3ffa60792bf043654d59c0bf46i0",
            "location": "66485af38bf58efbae945b9984772b73e861256984df17fb0005acb457552a58:1:0",
            "operation": "transfer_send",
            "ticker": "meme",
            "timestamp": 1694668171000,
            "transfer_send": {
              "amount": "25.000000000000000000",
              "from_address": "bc1p567nwl9w52g9zeu3jlqt530d5jeehfvykqmwn5mvdn46z2fujj3s740fs6",
              "to_address": "bc1p9y9ymk0859668sse3t00esxlz0dg57299xt8nhpnpyp9yvz3z90q7up7ee",
            },
            "tx_id": "66485af38bf58efbae945b9984772b73e861256984df17fb0005acb457552a58",
          },
          {
            "address": "3EPoFcTBfrdJfvUcaBCfB7uwXe79ymRW46",
            "block_hash": "0000000000000000000190e82594c49831e64782f42e7c2306b90d0338f9762b",
            "block_height": 807575,
            "inscription_id": "6eadea7b62e74a222d7616142363ba0e7ee14e589c1f43f2a8fd57f117dc3dfai0",
            "location": "a2e284be1d8eeae1c26014840b35f674c4838c87698ec0340aba0f4b4fc0962c:0:0",
            "operation": "transfer_send",
            "ticker": "FRAM",
            "timestamp": 1694668171000,
            "transfer_send": {
              "amount": "14800.000000000000000000",
              "from_address": "bc1qgwlvg63364mtvv09scqsl547nv9m2ly3rvvxx7",
              "to_address": "3EPoFcTBfrdJfvUcaBCfB7uwXe79ymRW46",
            },
            "tx_id": "a2e284be1d8eeae1c26014840b35f674c4838c87698ec0340aba0f4b4fc0962c",
          },
        ],
        "total": 739240,
      }
    `);
  }, 10e3);

  it('should get balance', async function () {
    const data = await getBalanceOnBlock(
      '0014ad42179475826f3cae94c1c3bae2797c6933a53a',
      802397,
    );

    expect(data).toBeDefined();
    expect(data).toMatchInlineSnapshot();
  });
});
