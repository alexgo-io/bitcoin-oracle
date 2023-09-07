/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getBitcoinBlockHeaderByHeight,
  getBitcoinTxStacks,
  getCurrentBitcoinHeader,
} from './get-bitcoin-tx-data-with-stacks';

describe('libs-bitcoin', () => {
  it('should get bitcoin data', async () => {
    expect(
      await getBitcoinTxStacks(
        '955b43b8ee955fb7ce0600db2438f4af88e1614aae2a1736d4f7b6fbe91e4d27',
      ),
    ).toMatchInlineSnapshot(`
      {
        "blockhash": "000000000000000000050d65faf92434bb8e8d8c25e0131f3c7bb2731fe6ebe7",
        "blocktime": 1690534024,
        "confirmations": 6109,
        "hash": "84330111a37e024a725e377fe3f06b3929a1f4dbfd91a5aa8424d7b67da67a91",
        "hex": "020000000001040af4b7daff9b42003563d23531bd834c85e04b853de0f88905cb6a9af8a431b60000000000ffffffff0af4b7daff9b42003563d23531bd834c85e04b853de0f88905cb6a9af8a431b60300000000ffffffff453c6297fdf7cd730a67cdef8007dc04304dca53aaf982d566b0be7e258fd4880000000000ffffffff6af80742388d64aafc294b54ebe8c030893a9e2688b419355626db0423be7a0e0000000000ffffffff059c8d020000000000160014926346eb8e6b9e07847e6b0602c286d718aa3ec62202000000000000225120da43891ea7ee8340808bdff2585ab62d1d356bac1b2292ad3cb641d9b7468baea07e2c0000000000160014c1c120f5fc204e9f29f338fed06d265b89eeccfe205b000000000000160014926346eb8e6b9e07847e6b0602c286d718aa3ec6c360290000000000225120da43891ea7ee8340808bdff2585ab62d1d356bac1b2292ad3cb641d9b7468bae02473044022045f530b928b7e26c4a17446ee0e35799423430b59e054d8f62b168f47400696902205b7718983e6d8cf70cc6f3d36ffa5952367469e66eef43b4e92b8c9143b5cbaa012102a257a168d80bde0d2dd0f8176d18afd575c951197436167b7b9fb24a2ee844700247304402206a413a1caa516310c597a6e66801130314dbb0f85cb16178c53ad201efe19bb3022050030701c5e4caaa5418940175ebb21228266517adf9cee921091b8f338ca88c012102a257a168d80bde0d2dd0f8176d18afd575c951197436167b7b9fb24a2ee844700247304402202be0f105d7295cfe3433c258548da8ab2575b76b223d9d54689083b3681014d502206fb6853c19e073e92787a75c496638eeb6461850de2563fdf59708bb977aeb4283210361682380cf53373958c41bc34691ba34aca9609d92cd54bd4023d2184b8049e20140310c6d98d47ad3637f7fd554fe0d72ae5b49585c3c148acef391fd7e9fcba91a7002d75c647da09574349075eb64effc9cc5644969245fd234ebb834ae64f45c00000000",
        "in_active_chain": true,
        "locktime": 0,
        "size": 742,
        "time": 1690534024,
        "txid": "955b43b8ee955fb7ce0600db2438f4af88e1614aae2a1736d4f7b6fbe91e4d27",
        "version": 2,
        "vin": [
          {
            "scriptSig": {
              "asm": "",
              "hex": "",
            },
            "sequence": 4294967295,
            "txid": "b631a4f89a6acb0589f8e03d854be0854c83bd3135d2633500429bffdab7f40a",
            "txinwitness": [
              "3044022045f530b928b7e26c4a17446ee0e35799423430b59e054d8f62b168f47400696902205b7718983e6d8cf70cc6f3d36ffa5952367469e66eef43b4e92b8c9143b5cbaa01",
              "02a257a168d80bde0d2dd0f8176d18afd575c951197436167b7b9fb24a2ee84470",
            ],
            "vout": 0,
          },
          {
            "scriptSig": {
              "asm": "",
              "hex": "",
            },
            "sequence": 4294967295,
            "txid": "b631a4f89a6acb0589f8e03d854be0854c83bd3135d2633500429bffdab7f40a",
            "txinwitness": [
              "304402206a413a1caa516310c597a6e66801130314dbb0f85cb16178c53ad201efe19bb3022050030701c5e4caaa5418940175ebb21228266517adf9cee921091b8f338ca88c01",
              "02a257a168d80bde0d2dd0f8176d18afd575c951197436167b7b9fb24a2ee84470",
            ],
            "vout": 3,
          },
          {
            "scriptSig": {
              "asm": "",
              "hex": "",
            },
            "sequence": 4294967295,
            "txid": "88d48f257ebeb066d582f9aa53ca4d3004dc0780efcd670a73cdf7fd97623c45",
            "txinwitness": [
              "304402202be0f105d7295cfe3433c258548da8ab2575b76b223d9d54689083b3681014d502206fb6853c19e073e92787a75c496638eeb6461850de2563fdf59708bb977aeb4283",
              "0361682380cf53373958c41bc34691ba34aca9609d92cd54bd4023d2184b8049e2",
            ],
            "vout": 0,
          },
          {
            "scriptSig": {
              "asm": "",
              "hex": "",
            },
            "sequence": 4294967295,
            "txid": "0e7abe2304db26563519b488269e3a8930c0e8eb544b29fcaa648d384207f86a",
            "txinwitness": [
              "310c6d98d47ad3637f7fd554fe0d72ae5b49585c3c148acef391fd7e9fcba91a7002d75c647da09574349075eb64effc9cc5644969245fd234ebb834ae64f45c",
            ],
            "vout": 0,
          },
        ],
        "vout": [
          {
            "n": 0,
            "scriptPubKey": {
              "address": "bc1qjf35d6uwdw0q0pr7dvrq9s5x6uv250kx9ltggy",
              "asm": "0 926346eb8e6b9e07847e6b0602c286d718aa3ec6",
              "desc": "addr(bc1qjf35d6uwdw0q0pr7dvrq9s5x6uv250kx9ltggy)#dguw6gxx",
              "hex": "0014926346eb8e6b9e07847e6b0602c286d718aa3ec6",
              "type": "witness_v0_keyhash",
            },
            "value": 0.00167324,
          },
          {
            "n": 1,
            "scriptPubKey": {
              "address": "bc1pmfpcj848a6p5pqytmle9sk4k95wn26avrv3f9tfukeqand6x3whq7y4kel",
              "asm": "1 da43891ea7ee8340808bdff2585ab62d1d356bac1b2292ad3cb641d9b7468bae",
              "desc": "addr(bc1pmfpcj848a6p5pqytmle9sk4k95wn26avrv3f9tfukeqand6x3whq7y4kel)#lyg9yw4m",
              "hex": "5120da43891ea7ee8340808bdff2585ab62d1d356bac1b2292ad3cb641d9b7468bae",
              "type": "witness_v1_taproot",
            },
            "value": 0.00000546,
          },
          {
            "n": 2,
            "scriptPubKey": {
              "address": "bc1qc8qjpa0uyp8f720n8rldqmfxtwy7an87lzxlgf",
              "asm": "0 c1c120f5fc204e9f29f338fed06d265b89eeccfe",
              "desc": "addr(bc1qc8qjpa0uyp8f720n8rldqmfxtwy7an87lzxlgf)#eycsdrqh",
              "hex": "0014c1c120f5fc204e9f29f338fed06d265b89eeccfe",
              "type": "witness_v0_keyhash",
            },
            "value": 0.02916,
          },
          {
            "n": 3,
            "scriptPubKey": {
              "address": "bc1qjf35d6uwdw0q0pr7dvrq9s5x6uv250kx9ltggy",
              "asm": "0 926346eb8e6b9e07847e6b0602c286d718aa3ec6",
              "desc": "addr(bc1qjf35d6uwdw0q0pr7dvrq9s5x6uv250kx9ltggy)#dguw6gxx",
              "hex": "0014926346eb8e6b9e07847e6b0602c286d718aa3ec6",
              "type": "witness_v0_keyhash",
            },
            "value": 0.00023328,
          },
          {
            "n": 4,
            "scriptPubKey": {
              "address": "bc1pmfpcj848a6p5pqytmle9sk4k95wn26avrv3f9tfukeqand6x3whq7y4kel",
              "asm": "1 da43891ea7ee8340808bdff2585ab62d1d356bac1b2292ad3cb641d9b7468bae",
              "desc": "addr(bc1pmfpcj848a6p5pqytmle9sk4k95wn26avrv3f9tfukeqand6x3whq7y4kel)#lyg9yw4m",
              "hex": "5120da43891ea7ee8340808bdff2585ab62d1d356bac1b2292ad3cb641d9b7468bae",
              "type": "witness_v1_taproot",
            },
            "value": 0.02711747,
          },
        ],
        "vsize": 451,
        "weight": 1801,
      }
    `);
  }, 20e3);

  it('should getBitcoinBlockHeaderByHeight', async () => {
    expect(await getBitcoinBlockHeaderByHeight(806048)).toMatchInlineSnapshot(
      `"00a04e30c989a54632fdd1e988414ca51165e9c59b3bc3f12f6d02000000000000000000f04a3b046cf92888e1dcf5b44225e90820cdda9d7e24f94d21d978655f909bb43e9ff4647b0f05176c15c57a"`,
    );
  });

  it('should getCurrentBitcoinHeader', async () => {
    expect(await getCurrentBitcoinHeader()).toBeDefined();
  });
});
