/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getBitcoinBlockHeaderByHeight,
  getCurrentBitcoinHeader,
} from './get-bitcoin-tx-data-with-stacks';
import { getBitcoinData$ } from './get-bitcoin.rx';

describe('libs-bitcoin', () => {
  it('should get bitcoin data', done => {
    const results: any[] = [];
    getBitcoinData$([
      '6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666a',
    ]).subscribe({
      next: result => {
        results.push(result);
      },
      complete: () => {
        expect(results).toMatchInlineSnapshot(`
[
  {
    "burnHeight": 802222,
    "header": "00400020eac1caaab83f909c1f05d7952849100df0c1164a61f3030000000000000000006f3ce3c363be3276d90d1b3010ca674428132d75fc6b1ce862e1f3dbec9303c9bf1ad26402610517794d6761",
    "height": 116214,
    "proof": {
      "hashes": [
        "dda0e069f2a7424098425254a6c8a9af5110a5f306ec4a9cdfb3f0e4c918ac94",
        "bb2da10a8f2b8807d2aebdef4cee9a9f2ba268377443ac6ac10e326faece478b",
        "4abd7193db0a77f327877a15728536d9f9d200d45321c9c0e1fe2b0a1b2663df",
        "bba11320a422c798bc734f29106000f9506780a387aa5d3e947ea3e4d3b0333f",
        "c3b0a062e682d55fc0418c6fccdf49d52cff515fa917cd9f54f1d068c3172be0",
        "5112216e651ca269bc02eeffe80e1639c8c08fa490ed126380f13d7bb7a35380",
        "645c0326b58fe67316ff7c469cfbf30845313a2c965eda5193d3d2818decc9c8",
        "bc73423d9dfd5c9111698159b27030245535a36b51cf4fa37363f1f7096b8a6b",
        "b5e80d79709e22b04bf9927c5fc2c0d258c68b707a9630f8046385c5cdbea819",
        "0f575a98a4fc2141c21889ecb2c5770daa173c94ce225811139887c5eca19df1",
        "aac69f67a3a5f08a379322f69df0dc376f600cb9d7f7ce6e7a9aa748b2fec1ec",
        "788fa40cef7640f04e1621b6e96d87ec5c7561f468bc0eb68c9a6c0782913041",
        "7516a8976f9d344eb923129b5c1af60f8b2d2f0646144e3090c8f0597380db18",
      ],
      "tree-depth": 13,
      "tx-index": 506,
    },
    "tx": "010000000001013d2b02c99d27f88e441d2b30900fb1bd833eaa21b599382eee22aea1562dc5660000000000f5ffffff012202000000000000160014870dba15d6b5a0563b6df472359a7ef75d21f26c0340bd2d7adaa7d57c4d7392049c28e89a87e9f81c064b1f202c9317f496ba0ea840ff99e6355133ca278c26a2811ee5b27efb455a203c119ba4864f1d206ee632788320308e1051d43be9dc03c5822baf19a998f12fcd0080d7a20981221b0cdb3db272ac0063036f7264010118746578742f706c61696e3b636861727365743d7574662d38003d7b2270223a226272632d3230222c20226f70223a227472616e73666572222c20227469636b223a2272646578222c2022616d74223a223130303030227d6821c1308e1051d43be9dc03c5822baf19a998f12fcd0080d7a20981221b0cdb3db27200000000",
  },
]
`);
        done();
      },
    });
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
