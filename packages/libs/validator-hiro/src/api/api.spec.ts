import { getActivityOnBlock$, getAllActivitiesOnBlock$ } from './api';
import { getActivityOnBlock, getBalanceOnBlock } from './api.raw';

describe('Hiro API', function () {
  it.skip('should get activity', async function () {
    const data = await getActivityOnBlock(802396, 0, 2);
    expect(data).toBeDefined();
    expect(data).toMatchInlineSnapshot(`
      {
        "limit": 2,
        "offset": 0,
        "results": [
          {
            "address": "bc1pyrgf85yca9zpkc4q7m2ta5j73cp8kgz0cec8h0y2rrses85jwlxs5mphus",
            "block_hash": "000000000000000000050cc43ce1e33a57f0b953e27b733eda042e6fe6b16df9",
            "block_height": 807657,
            "inscription_id": "7728635dd2a2bc67d7408368973c32c12814de3c29019ea78919eabe2a57605bi0",
            "location": "30305b4f40f760e4228ea94a73f849ff1c1a4b8ee414f80b85ac8e47af3bbde4:1:0",
            "operation": "transfer_send",
            "ticker": "trac",
            "timestamp": 1694712011000,
            "transfer_send": {
              "amount": "1000.000000000000000000",
              "from_address": "bc1pgcul57dg5w6fql3x8ac6zxph98xq0ddh9m25hd0q5ze3jhagn2hs3q6xnt",
              "to_address": "bc1pyrgf85yca9zpkc4q7m2ta5j73cp8kgz0cec8h0y2rrses85jwlxs5mphus",
            },
            "tx_id": "30305b4f40f760e4228ea94a73f849ff1c1a4b8ee414f80b85ac8e47af3bbde4",
          },
          {
            "address": "bc1pluvguhzeduclycxsusxc8a24jphgk4ruq08xgf96qek4vn4m9xvqdjrgmf",
            "block_hash": "000000000000000000050cc43ce1e33a57f0b953e27b733eda042e6fe6b16df9",
            "block_height": 807657,
            "inscription_id": "e5b5bc4499aa5c912e96088b1876b1ca100a72aa71cd36827b27f92a5a9738cai0",
            "location": "3797035f4faf1abee85a9c9b47327451868f7603dfa697ad3d751bc0ae3ce588:0:0",
            "operation": "transfer_send",
            "ticker": "BTCs",
            "timestamp": 1694712011000,
            "transfer_send": {
              "amount": "100.000000000000000000",
              "from_address": "bc1pypphtq6jczzqzs387x0k3s3ez2z5vyyyj5f2r220wc5zxqagzyssyhvrtz",
              "to_address": "bc1pluvguhzeduclycxsusxc8a24jphgk4ruq08xgf96qek4vn4m9xvqdjrgmf",
            },
            "tx_id": "3797035f4faf1abee85a9c9b47327451868f7603dfa697ad3d751bc0ae3ce588",
          },
        ],
        "total": 739718,
      }
    `);
  }, 10e3);

  it.skip('should get parsed activity', done => {
    getActivityOnBlock$(802396, 0, 2).subscribe(value => {
      expect(value.results).toMatchInlineSnapshot(`
        [
          {
            "address": "512020d093d098e9441b62a0f6d4bed25e8e027b204fc6707bbc8a18e1981e9277cd",
            "block_hash": "000000000000000000050cc43ce1e33a57f0b953e27b733eda042e6fe6b16df9",
            "block_height": 807657,
            "inscription_id": "7728635dd2a2bc67d7408368973c32c12814de3c29019ea78919eabe2a57605bi0",
            "location": {
              "satpoint": 0n,
              "tx_id": "30305b4f40f760e4228ea94a73f849ff1c1a4b8ee414f80b85ac8e47af3bbde4",
              "vout": 1n,
            },
            "operation": "transfer_send",
            "ticker": "trac",
            "timestamp": 1694712011000,
            "transfer_send": {
              "amount": 1000000000000000000000n,
              "from_address": "51204639fa79a8a3b4907e263f71a1183729cc07b5b72ed54bb5e0a0b3195fa89aaf",
              "to_address": "512020d093d098e9441b62a0f6d4bed25e8e027b204fc6707bbc8a18e1981e9277cd",
            },
            "tx_id": "30305b4f40f760e4228ea94a73f849ff1c1a4b8ee414f80b85ac8e47af3bbde4",
          },
          {
            "address": "5120ff188e5c596f31f260d0e40d83f555906e8b547c03ce6424ba066d564ebb2998",
            "block_hash": "000000000000000000050cc43ce1e33a57f0b953e27b733eda042e6fe6b16df9",
            "block_height": 807657,
            "inscription_id": "e5b5bc4499aa5c912e96088b1876b1ca100a72aa71cd36827b27f92a5a9738cai0",
            "location": {
              "satpoint": 0n,
              "tx_id": "3797035f4faf1abee85a9c9b47327451868f7603dfa697ad3d751bc0ae3ce588",
              "vout": 0n,
            },
            "operation": "transfer_send",
            "ticker": "BTCs",
            "timestamp": 1694712011000,
            "transfer_send": {
              "amount": 100000000000000000000n,
              "from_address": "51202043758352c084014227f19f68c23912854610849512a1a94f76282303a81121",
              "to_address": "5120ff188e5c596f31f260d0e40d83f555906e8b547c03ce6424ba066d564ebb2998",
            },
            "tx_id": "3797035f4faf1abee85a9c9b47327451868f7603dfa697ad3d751bc0ae3ce588",
          },
        ]
      `);
      done();
    });
  });

  it.skip('should get activity match schema', function (done) {
    getAllActivitiesOnBlock$(802396, 2, 6).subscribe(value => {
      expect(value).toMatchInlineSnapshot(`
        [
          {
            "address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            "block_hash": "0000000000000000000315cad6058c2f977b91b99dad7f6b9a4be3daba20c169",
            "block_height": 807597,
            "inscription_id": "f95f50e2e9787f2617e8d96d6f3439b70ba12f6f1513b5da575f6a4c8bc11debi0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694678289000,
            "transfer_send": {
              "amount": 200000000000000000000000000000n,
              "from_address": "0014519cd00a4c05a26b9784ba06bf3f657e524534aa",
              "to_address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            },
            "tx_id": "3667d72824d362f6628498c6d4e1a82212f7ef5cc44e0f3ebd0132654283fb1d",
          },
          {
            "address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            "block_hash": "0000000000000000000315cad6058c2f977b91b99dad7f6b9a4be3daba20c169",
            "block_height": 807597,
            "inscription_id": "532429be69cd1144705c8664698fe61fa68b1f5bde4bcbe12e0bd84794f1b4fci0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694678289000,
            "transfer_send": {
              "amount": 150000000000000000000000000000n,
              "from_address": "5120a7c6dd0638c3a22b7828728358df6243d42dedb304af842c0fc3cb2bc59e9456",
              "to_address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            },
            "tx_id": "e5369a6c95bd869678faad9260301d646dd055b6d3da8b11cc2189e8d78c2db8",
          },
          {
            "address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            "block_hash": "0000000000000000000315cad6058c2f977b91b99dad7f6b9a4be3daba20c169",
            "block_height": 807597,
            "inscription_id": "949d4ef918d091f102f21ff55d352d97743c625b6ebfe90aa3f748daa3f31819i0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694678289000,
            "transfer_send": {
              "amount": 300000000000000000000000000000n,
              "from_address": "001413c8d4f4be75d11b463a35b141a1067155c407a8",
              "to_address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            },
            "tx_id": "95d89b701101c51238a217c12dc65c04642f1f0c0b807037047e386f2b541fc3",
          },
          {
            "address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            "block_hash": "0000000000000000000315cad6058c2f977b91b99dad7f6b9a4be3daba20c169",
            "block_height": 807597,
            "inscription_id": "e3609517e7b393ee3b5433ca7c1c7533bfc121ffd819aa96f045b09c0b318b8ci0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694678289000,
            "transfer_send": {
              "amount": 100000000000000000000000000000n,
              "from_address": "00145ab2d25e8a98bce67f993771c939867e7d1865a1",
              "to_address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            },
            "tx_id": "c99e2ea0ce45cf218b81abf1cb7076059d8d1bcfebff2feab3ccb1fd4da9acd8",
          },
          {
            "address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            "block_hash": "0000000000000000000315cad6058c2f977b91b99dad7f6b9a4be3daba20c169",
            "block_height": 807597,
            "inscription_id": "08b723b18c6d74aa5950b1646159431309ef63d45d969dd0b0d7100b1a076d85i0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694678289000,
            "transfer_send": {
              "amount": 200000000000000000000000000000n,
              "from_address": "00140e137a24f03d517fe4ca60efab72ab55a996a752",
              "to_address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            },
            "tx_id": "0dec4f40135093c43e6379dde53f6d2db5c12c4d2582a70e09a576c29ce601f9",
          },
          {
            "address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            "block_hash": "0000000000000000000315cad6058c2f977b91b99dad7f6b9a4be3daba20c169",
            "block_height": 807597,
            "inscription_id": "0fa644a41cc7f65b134c2e22e131386623241deba822ed603d74295c797b949bi0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694678289000,
            "transfer_send": {
              "amount": 200000000000000000000000000000n,
              "from_address": "00140e137a24f03d517fe4ca60efab72ab55a996a752",
              "to_address": "5120ffe2bec636c2dbc56645a181ab159c4f5ab2bdad76b4cba5fa334ce96315d629",
            },
            "tx_id": "597afad4ffa8509b1939eff0c46a3f0450cf18f22bbe6f7621feafd2e2908d6e",
          },
        ]
      `);
      done();
    });
  }, 10e3);

  it.skip('should get balance', async function () {
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
