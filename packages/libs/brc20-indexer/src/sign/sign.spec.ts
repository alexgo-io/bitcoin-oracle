import { kIndexerContractName } from '../constants';
import { OracleContracts } from '../generated';
import { getDomainHash, signTx, structuredDataHash } from './sign';

describe('sign', () => {
  it('should get correct domain hash', () => {
    expect(getDomainHash().toString('hex')).toMatchInlineSnapshot(
      `"6d11cd301d11961e7cfeabd61e3f4da17f42f3d627362c8878aa9cbb5c532be2"`,
    );
  });

  it('should sign tx', async () => {
    const encoder =
      OracleContracts[kIndexerContractName]['hash-tx'].input[0].type.encode;
    const encodeValue = encoder({
      amt: 99999999999999991433150857216n,
      from: Buffer.from(
        '5120b9a9630e445eab6ea4606dd8d32aa1795eeae6d1c7fd9425d457ecdacc4d2063',
        'hex',
      ),
      'from-bal': 175300000000000017475081076736n,
      to: Buffer.from('00146e7b185c81183db52a29051b0320739ff5800494', 'hex'),
      'to-bal': 269999999999999999739349172224n,
      'bitcoin-tx': Buffer.from(
        '02000000000105c18a6ac26fa881de71151581cd6a02dd3251f066380a4473019a2b33eba8647e0500000000ffffffffc18a6ac26fa881de71151581cd6a02dd3251f066380a4473019a2b33eba8647e0600000000ffffffff517bc049e63b63a5995059556740ccbefa2de0472f84dda986da2b9cbd771a900000000000ffffffffb48c60f47b1dd489f48a12563c36cfd279245f19d6aa2010679947769767cc1a0100000000ffffffffc18a6ac26fa881de71151581cd6a02dd3251f066380a4473019a2b33eba8647e0000000000ffffffff075802000000000000160014f0d881f38ceca64160611d18cfbf2ad5af66f2bc22020000000000001600146e7b185c81183db52a29051b0320739ff5800494206e4e0000000000225120b9a9630e445eab6ea4606dd8d32aa1795eeae6d1c7fd9425d457ecdacc4d2063a0a000000000000016001421e41f02e12e7e7ee85b0b4a2400f11387f5db7c303b8b00000000001600146e7b185c81183db52a29051b0320739ff58004942c01000000000000160014f0d881f38ceca64160611d18cfbf2ad5af66f2bc2c01000000000000160014f0d881f38ceca64160611d18cfbf2ad5af66f2bc02483045022100e6b9799e9e5222ce5146cacdbb5a122b6bff2d9bb88ba847d0a16598e03b9e5102202b2ffffcf8764cea632652fe49f342cb02a436d3f1abf1e80ae6fe02810b27760121020428720baacfa45e7fcd8dae1342d1c2c7abe2e4182a30e2bb5412d2e211866102473044022052e2a71aa4fbcf0be0984f28c7afc5302d59d1d7f426eae6b982acfd8f025f9a022051ab21828fb60c1ea6ced53b6f25ed3907c3efde19649dd9593f600c26c88ed40121020428720baacfa45e7fcd8dae1342d1c2c7abe2e4182a30e2bb5412d2e2118661014196fbdfc994229e189329d0a32d34d23c44a26c75405514b403e5df56f5c178ede68b32ad7f54d766f033b60e24b58a01131241def266e416a1e65e915af4ae1d8302483045022100b1b2e617a1690c51cbc3ffd1b916c08e7398d2cf58098ade94c22d291cef81e10220152901104f9eeb87d8970e8cca78599b0e00509c2c0262131c6b252c04892e43012103b16b71aa0d39546797e5fc1e449bee1b8301275bcebb34c462d685f9fc3f044c02483045022100b58982e1800d4c9514c1979657970d1f8bae30050d345b5d796ccd5c1b5677ca02207eb6c2962990717ebff8a1532c739e3aa00fb174ab186d8e0869a3829e4f0d670121020428720baacfa45e7fcd8dae1342d1c2c7abe2e4182a30e2bb5412d2e211866100000000',
        'hex',
      ),
      tick: 'SATS',
      decimals: 18n,
      output: 1n,
      offset: 0n,
    });

    const hash = structuredDataHash(encodeValue);
    expect(hash.toString('hex')).toMatchInlineSnapshot(
      `"659487fb3a5f4d93107e22e741c45282694a69893aa7c9c6d6912c93ff952c27"`,
    );
    const signature = await signTx(
      '114dd00b2407eb036aa12c38662ed35ff3ba6c4f743b5a8ae4c984ac0ec7afe301',
      encodeValue,
    );
    expect(signature.toString('hex')).toMatchInlineSnapshot(
      `"9343450e5712edd7b969c52c1e9e4ca5aa98ecf62ff7f3035b90d559605165022f9e6baa2f6f01f4ca082212513536f43516a01c12db006230fa44dde6da9e5800"`,
    );
  });
});
