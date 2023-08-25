import { envDevelopment } from '@alex-b20/env';
import { expect } from 'vitest';
import { indexer } from '../generated/contract_indexer';
import { getDomainHash, signTx, structuredDataHash } from './sign';

describe('sign', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    });

    const hash = structuredDataHash(encodeValue);
    expect(hash.toString('hex')).toMatchInlineSnapshot(
      '"23fe3e04c4d6b9b6b7e00ddbf30e498dad53778264532b52261a0d0b91ed78ea"',
    );
    const signature = await signTx(
      envDevelopment.STACKS_DEPLOYER_ACCOUNT_SECRET,
      encodeValue,
    );
    expect(signature.toString('hex')).toMatchInlineSnapshot(
    '"36546f44561c861c51ad0f9f07fbdf144894f84ca362f6f462dcc3a6ab8705383c771a0f387b6ebbc235942e90e4d8f52e039c86d974ea7db1525f0afb18272400"');
  });
});
