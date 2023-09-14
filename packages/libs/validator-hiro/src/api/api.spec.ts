import { getAllActivitiesOnBlock$ } from './api';
import { getActivityOnBlock, getBalanceOnBlock } from './api.raw';

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
            "address": "bc1pl52nl77zc7j3f7wtd9g2rwpzse39mpu0qtwdda5axk6hqdhwlg5quff5qw",
            "block_hash": "00000000000000000002ae73ecff763831e4f150132d070026b9ae2bcf04f0e2",
            "block_height": 807588,
            "inscription_id": "6667e7e60d1d7ec07a78a9df403067e1f69eab7b3f9c060e7ca86fba79a1bb9ci0",
            "location": "10e14faca2e2b977b91bd6f9146cd8b38233555c76ae0c81f1367ad75be355ac:0:0",
            "operation": "transfer_send",
            "ticker": "NTTT",
            "timestamp": 1694673803000,
            "transfer_send": {
              "amount": "1080.000000000000000000",
              "from_address": "bc1pmv09prt6cn5x9aj7e2swea73vxstkxr45p8qnax7308l2mp6syuq0v68z3",
              "to_address": "bc1pl52nl77zc7j3f7wtd9g2rwpzse39mpu0qtwdda5axk6hqdhwlg5quff5qw",
            },
            "tx_id": "10e14faca2e2b977b91bd6f9146cd8b38233555c76ae0c81f1367ad75be355ac",
          },
          {
            "address": "bc1p6zxqmc68c9r8p5z733jyhtgv7qgpny0ck8urzx88qd03kfmwwqrqln9ers",
            "block_hash": "00000000000000000002ae73ecff763831e4f150132d070026b9ae2bcf04f0e2",
            "block_height": 807588,
            "inscription_id": "41f7f57447891ba31fba127e438d0f240587a739e64ee496758ae7a26817dc68i0",
            "location": "d24355151bd1aafc0adbec1b2dffbf6137dfc3ae9a06ee2e0ed65f664390afbd:1:0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694673803000,
            "transfer_send": {
              "amount": "100000000000.000000000000000000",
              "from_address": "bc1quwxgw94fct7xu20z06uvd8hd0fk5f3a0u9w7rr",
              "to_address": "bc1p6zxqmc68c9r8p5z733jyhtgv7qgpny0ck8urzx88qd03kfmwwqrqln9ers",
            },
            "tx_id": "d24355151bd1aafc0adbec1b2dffbf6137dfc3ae9a06ee2e0ed65f664390afbd",
          },
        ],
        "total": 739298,
      }
    `);
  }, 10e3);

  it('should get activity match schema', function (done) {
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
