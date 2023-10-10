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
      amt: 10n,
      from: Buffer.from('01'),
      'from-bal': 20n,
      to: Buffer.from('02'),
      'to-bal': 21n,
      'bitcoin-tx': Buffer.from('03'),
      tick: 'sat',
      output: 99n,
      offset: 0n,
    });

    const hash = structuredDataHash(encodeValue);
    expect(hash.toString('hex')).toMatchInlineSnapshot(
      `"6d11cd301d11961e7cfeabd61e3f4da17f42f3d627362c8878aa9cbb5c532be2"`,
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
