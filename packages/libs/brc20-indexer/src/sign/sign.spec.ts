import { indexer } from '../generated/contract_indexer';
import { getDomainHash, signTx, structuredDataHash } from './sign';

describe('sign', () => {
  it('should get correct domain hash', () => {
    expect(getDomainHash().toString('hex')).toMatchInlineSnapshot(
      `"84deb9a3b41b870d85819000deefa999f43b1bf2c3d80c3ea19d4b83b7b10fbc"`,
    );
  });

  it('should sign tx', async () => {
    const encoder = indexer['indexer']['hash-tx'].input[0].type.encode;
    const encodeValue = encoder({
      amt: 22000000000000000000000n,
      from: Buffer.from(
        '5120fd60cb617c9c9e5d8d612f56805d7b7b55383a2477cc063ec99ce1f82730e1f3',
        'hex',
      ),
      'from-bal': 0n,
      to: Buffer.from(
        '512033b6efa5c46830b6ea184fb31c38b3d5cf42f7a3738415fdf96a86d3971ddf67',
        'hex',
      ),
      'to-bal': 22000000000000000000000n,
      'bitcoin-tx': Buffer.from(
        '020000000001020eff3512154960490cabf7775309b046a24c9c1da2b4912d9b1dc27a180e8c98000000000001000080aed10330c5bc5540c29b839997c1dd4a98651590621ec3eea854b0b1453d5d3301000000000100008002220200000000000022512033b6efa5c46830b6ea184fb31c38b3d5cf42f7a3738415fdf96a86d3971ddf67b263010000000000225120fd60cb617c9c9e5d8d612f56805d7b7b55383a2477cc063ec99ce1f82730e1f30140cafc44bea0ab6098c21e2dafd69df3eef13d8c32f64f2e12e5008a10acddba573d72463359eb9bd17348dfbf8d1f99ab6f799734a5725d2ffadc4d2e6b5c29770140f1b8685e534e7e99b8b108ba48a80227bb8c0caf1d57316f67f117a36119825ea8f8fe64192ddc7b891fa073e19a05dcf9e0564263fe6367c7a7eef87e3a2f7800000000',
        'hex',
      ),
      tick: 'XBTC',
      output: 0n,
      offset: 0n,
    });

    const hash = structuredDataHash(encodeValue);
    expect(hash.toString('hex')).toMatchInlineSnapshot(
      `"f62aa6e32781feb0bcbb84c2df7d9838eb2a092bc4c66ed6d6d38d2ab72f438d"`,
    );
    const signature = await signTx(
      '114dd00b2407eb036aa12c38662ed35ff3ba6c4f743b5a8ae4c984ac0ec7afe301',
      encodeValue,
    );
    expect(signature.toString('hex')).toMatchInlineSnapshot(
      `"cc0659d8d366e0516a8fdadde96d1ef59a8186786558d8f817e259ca8f62837e744055fb03f4690df9603fc469f81aece4e838fbde32c157a6fef905b4acf8a201"`,
    );
  });
});
