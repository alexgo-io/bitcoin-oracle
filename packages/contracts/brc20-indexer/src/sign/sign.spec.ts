import { indexer } from '../generated/contract_indexer';
import { getDomainHash, signTx, structuredDataHash } from './sign';

describe('sign', () => {
  it('should get correct domain hash', () => {
    expect(getDomainHash().toString('hex')).toMatchInlineSnapshot(
      '"84deb9a3b41b870d85819000deefa999f43b1bf2c3d80c3ea19d4b83b7b10fbc"',
    );
  });

  it('should sign tx', async () => {
    const encoder = indexer['indexer']['hash-tx'].input[0].type.encode;
    const encodeValue = encoder({
      amt: 10n,
      from: Buffer.from('0x01'),
      'from-bal': 20n,
      to: Buffer.from('0x02'),
      'to-bal': 21n,
      'bitcoin-tx': Buffer.from('0x03'),
      tick: 'sat',
      output: 99n,
      offset: 0n,
    });

    const hash = structuredDataHash(encodeValue);
    expect(hash.toString('hex')).toMatchInlineSnapshot(
      `"9de2e728645f376971b761726f16f9b4c40892dc7e308cb35cf76b6e66e3eb43"`,
    );
    const signature = await signTx(
      '114dd00b2407eb036aa12c38662ed35ff3ba6c4f743b5a8ae4c984ac0ec7afe301',
      encodeValue,
    );
    expect(signature.toString('hex')).toMatchInlineSnapshot(
      `"e1f092eb251b180e73f381bf1da0514b86af4aaaadbc626235cb8cb7d3b1fa1877a23797cfc63000f3f0f9acb82fbd581821b25dc84f8370344db58690ccb7e601"`,
    );
  });
});
