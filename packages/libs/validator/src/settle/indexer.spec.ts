import {
  callPublic,
  callReadonlyWith,
  kIndexerContractName,
  processOperations,
  signTx,
  structuredDataHash,
} from '@meta-protocols-oracle/brc20-indexer';
import { StacksMocknet } from '@stacks/network';
import { bufferCV, stringCV, tupleCV } from '@stacks/transactions';
import { uintCV } from 'clarity-codegen';
import fetch from 'node-fetch';
import { randomBytes } from 'node:crypto';
import { env } from '../env';
import { envTest } from '../env-test';

describe('Indexer', () => {
  const readonlyCall = callReadonlyWith(
    envTest().STACKS_DEPLOYER_ACCOUNT_ADDRESS,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new StacksMocknet({ url: env().STACKS_API_URL, fetchFn: fetch as any }),
    envTest().STACKS_DEPLOYER_ACCOUNT_ADDRESS,
  );
  const bisData = {
    activity_type: 'transfer-transfer',
    amount: '10000000000000000000000',
    id: 28093931,
    inscription_id:
      '6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666ai0',
    tx_id: randomBytes(32).toString('hex'),
    new_pkscript: '0014ad42179475826f3cae94c1c3bae2797c6933a53a',
    old_pkscript: '0014870dba15d6b5a0563b6df472359a7ef75d21f26c',
    tick: 'rdex',
  } as const;

  it.skip('should get correct order hash', async () => {
    const hash = await readonlyCall(kIndexerContractName, 'hash-tx', {
      tx: {
        from: Buffer.from(bisData.old_pkscript),
        to: Buffer.from(bisData.new_pkscript),
        output: 10n,
        offset: 0n,
        decimals: 18n,
        tick: 'sat',
        amt: 1000n,
        'bitcoin-tx': Buffer.from(
          '000000000000000000037299db1bd5b0872f8379d9971fcca36171825ee9cc83',
          'hex',
        ),
        'from-bal': BigInt(bisData.amount),
        'to-bal': BigInt(bisData.amount),
      },
    });
    const hashFromContract = Buffer.from(hash).toString('hex');
    expect(hashFromContract).toMatchInlineSnapshot(
      `"250a0842e588b20642a3c72866390655c7f6c7575c57de6f3df8a124c1e119af"`,
    );

    const orderHash = structuredDataHash(
      tupleCV({
        from: bufferCV(Buffer.from(bisData.old_pkscript)),
        to: bufferCV(Buffer.from(bisData.new_pkscript)),
        output: uintCV(10n),
        offset: uintCV(0n),
        tick: stringCV('sat', 'utf8'),
        amt: uintCV(1000n),
        decimals: uintCV(18n),
        'bitcoin-tx': bufferCV(
          Buffer.from(
            '000000000000000000037299db1bd5b0872f8379d9971fcca36171825ee9cc83',
            'hex',
          ),
        ),
        'from-bal': uintCV(BigInt(bisData.amount)),
        'to-bal': uintCV(BigInt(bisData.amount)),
      }),
    );
    const hashLocal = orderHash.toString('hex');
    expect(hashLocal).toMatchInlineSnapshot(
      `"250a0842e588b20642a3c72866390655c7f6c7575c57de6f3df8a124c1e119af"`,
    );

    expect(hashFromContract).toEqual(hashLocal);
  });

  it.skip('should index tx', async () => {
    const process = processOperations(envTest().STACKS_RELAYER_ACCOUNT_SECRET, {
      contractAddress: envTest().STACKS_DEPLOYER_ACCOUNT_ADDRESS,
      stacksAPIURL: env().STACKS_API_URL,
      puppetURL: envTest().STACKS_PUPPET_URL,
      fee: 2e3,
    });

    const amt = BigInt('0x' + randomBytes(10).toString('hex'));
    const bitcoinTx = randomBytes(32);
    const order = tupleCV({
      from: bufferCV(Buffer.from(bisData.old_pkscript, 'hex')),
      to: bufferCV(Buffer.from(bisData.new_pkscript, 'hex')),
      output: uintCV(10n),
      tick: stringCV('sat', 'utf8'),
      amt: uintCV(amt),
      'bitcoin-tx': bufferCV(bitcoinTx),
      'from-bal': uintCV(BigInt(bisData.amount) + amt),
      'to-bal': uintCV(BigInt(bisData.amount)),
    });
    const orderHash = structuredDataHash(order);

    const signature = await signTx(
      envTest().STACKS_VALIDATOR_ACCOUNT_SECRET,
      order,
    );

    await process([
      callPublic(kIndexerContractName, 'index-tx-many', {
        'tx-many': [
          {
            block: {
              header: Buffer.from(''),
              height: 101n,
            },
            proof: {
              hashes: [Buffer.from(bisData.tx_id, 'hex')],
              'tree-depth': 1n,
              'tx-index': 0n,
            },
            tx: {
              from: Buffer.from(bisData.old_pkscript),
              to: Buffer.from(bisData.new_pkscript),
              output: 10n,
              offset: 0n,
              tick: 'sat',
              amt,
              decimals: 18n,
              'bitcoin-tx': bitcoinTx,
              'from-bal': BigInt(bisData.amount) + amt,
              'to-bal': BigInt(bisData.amount),
            },
            'signature-packs': [
              {
                signature: signature,
                signer: envTest().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
                'tx-hash': orderHash,
              },
            ],
          },
        ],
      }),
    ]);
  });
});
