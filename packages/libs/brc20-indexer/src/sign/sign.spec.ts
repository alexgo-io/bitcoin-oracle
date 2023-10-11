import { indexer } from '../generated/contract_indexer';
import { getDomainHash, signTx, structuredDataHash } from './sign';

describe('sign', () => {
  it('should get correct domain hash', () => {
    expect(getDomainHash().toString('hex')).toMatchInlineSnapshot(
      `"6d11cd301d11961e7cfeabd61e3f4da17f42f3d627362c8878aa9cbb5c532be2"`,
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
      `"881d23d98389419449228406955a44d7e80b53d608fd660b8c5b553dee5b7607"`,
    );
    const signature = await signTx(
      '114dd00b2407eb036aa12c38662ed35ff3ba6c4f743b5a8ae4c984ac0ec7afe301',
      encodeValue,
    );
    expect(signature.toString('hex')).toMatchInlineSnapshot(
      `"a647cc5203c8efc9b4160ad18528c7e2716c1ba91b86988f28a06e8cb9371ddd7d31d488b9d3757ac6feab8b82be40926cf25b5af2852bfbfa0b4d05226184df01"`,
    );
  });
});
