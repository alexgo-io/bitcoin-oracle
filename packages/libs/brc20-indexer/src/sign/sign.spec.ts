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
      `"f62aa6e32781feb0bcbb84c2df7d9838eb2a092bc4c66ed6d6d38d2ab72f438d"`,
    );
    const signature = await signTx(
      '114dd00b2407eb036aa12c38662ed35ff3ba6c4f743b5a8ae4c984ac0ec7afe301',
      encodeValue,
    );
    expect(signature.toString('hex')).toMatchInlineSnapshot(
      `"7e8730beb34166ab2f3c5de3d253fd8eb13a5b6a24bea9e2c85fbac519b17ee75448463a06a1a208f751259c3a1f10dfddf35ff0844a2b6ba85b50e8916c32e500"`,
    );
  });
});
