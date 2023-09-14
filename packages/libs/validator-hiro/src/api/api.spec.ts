import { firstValueFrom } from 'rxjs';
import { getActivityOnBlock$ } from './api';
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

  it('should get activity match schema', async function () {
    const data = await firstValueFrom(getActivityOnBlock$(802396, 0, 2));
    expect(data).toBeDefined();
    expect(data).toMatchInlineSnapshot(`
      {
        "limit": 2,
        "offset": 0,
        "results": [
          {
            "address": "5120fd153ffbc2c7a514f9cb6950a1b82286625d878f02dcd6f69d35b57036eefa28",
            "block_hash": "00000000000000000002ae73ecff763831e4f150132d070026b9ae2bcf04f0e2",
            "block_height": 807588,
            "inscription_id": "6667e7e60d1d7ec07a78a9df403067e1f69eab7b3f9c060e7ca86fba79a1bb9ci0",
            "operation": "transfer_send",
            "ticker": "NTTT",
            "timestamp": 1694673803000,
            "transfer_send": {
              "amount": 1080000000000000000000n,
              "from_address": "5120db1e508d7ac4e862f65ecaa0ecf7d161a0bb1875a04e09f4de8bcff56c3a8138",
              "to_address": "5120fd153ffbc2c7a514f9cb6950a1b82286625d878f02dcd6f69d35b57036eefa28",
            },
            "tx_id": "10e14faca2e2b977b91bd6f9146cd8b38233555c76ae0c81f1367ad75be355ac",
          },
          {
            "address": "5120d08c0de347c14670d05e8c644bad0cf0101991f8b1f83118e7035f1b276e7006",
            "block_hash": "00000000000000000002ae73ecff763831e4f150132d070026b9ae2bcf04f0e2",
            "block_height": 807588,
            "inscription_id": "41f7f57447891ba31fba127e438d0f240587a739e64ee496758ae7a26817dc68i0",
            "operation": "transfer_send",
            "ticker": "sats",
            "timestamp": 1694673803000,
            "transfer_send": {
              "amount": 100000000000000000000000000000n,
              "from_address": "0014e38c8716a9c2fc6e29e27eb8c69eed7a6d44c7af",
              "to_address": "5120d08c0de347c14670d05e8c644bad0cf0101991f8b1f83118e7035f1b276e7006",
            },
            "tx_id": "d24355151bd1aafc0adbec1b2dffbf6137dfc3ae9a06ee2e0ed65f664390afbd",
          },
        ],
        "total": 739298,
      }
    `);
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
