import {
  callPublic,
  callReadonlyWith,
  kIndexerContractName,
  processOperations,
  signTx,
  structuredDataHash,
} from '@alex-b20/brc20-indexer';
import { StacksMocknet } from '@stacks/network';
import { bufferCV, stringCV, tupleCV } from '@stacks/transactions';
import { uintCV } from 'clarity-codegen';
import { randomBytes } from 'node:crypto';
import { env } from '../env';
import { envTest } from '../env-test';

describe('Indexer', () => {
  const readonlyCall = callReadonlyWith(
    envTest().STACKS_DEPLOYER_ACCOUNT_ADDRESS,
    new StacksMocknet({ url: env().STACKS_API_URL }),
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
    new_wallet: 'bc1q44pp09r4sfhnet55c8pm4cne035n8ff6t0lhgz',
    old_pkscript: '0014870dba15d6b5a0563b6df472359a7ef75d21f26c',
    old_wallet: 'bc1qsuxm59wkkks9vwmd73ertxn77awjrunv8x0nv6',
    tick: 'rdex',
  } as const;

  it.skip('should get correct order hash', async () => {
    const hash = await readonlyCall(kIndexerContractName, 'hash-tx', {
      tx: {
        from: Buffer.from(bisData.old_wallet),
        to: Buffer.from(bisData.new_wallet),
        output: 10n,
        offset: 0n,
        tick: 'sat',
        amt: 1000n,
        'bitcoin-tx': Buffer.from(
          '000000000000000000037299db1bd5b0872f8379d9971fcca36171825ee9cc83',
        ),
        'from-bal': BigInt(bisData.amount),
        'to-bal': BigInt(bisData.amount),
      },
    });
    expect(Buffer.from(hash).toString('hex')).toMatchInlineSnapshot(
      `"dbb25a3f54069f8a64abc88bc423547ae7fb4338b1dca1733a591705e97b8184"`,
    );

    const orderHash = structuredDataHash(
      tupleCV({
        from: bufferCV(Buffer.from(bisData.old_wallet)),
        to: bufferCV(Buffer.from(bisData.new_wallet)),
        output: uintCV(10n),
        tick: stringCV('sat', 'utf8'),
        amt: uintCV(1000n),
        'bitcoin-tx': bufferCV(
          Buffer.from(
            '000000000000000000037299db1bd5b0872f8379d9971fcca36171825ee9cc83',
          ),
        ),
        'from-bal': uintCV(BigInt(bisData.amount)),
        'to-bal': uintCV(BigInt(bisData.amount)),
      }),
    );
    expect(orderHash.toString('hex')).toMatchInlineSnapshot(
      `"dbb25a3f54069f8a64abc88bc423547ae7fb4338b1dca1733a591705e97b8184"`,
    );
  });

  it('should index tx', async () => {
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
              from: Buffer.from(bisData.old_wallet),
              to: Buffer.from(bisData.new_wallet),
              output: 10n,
              offset: 0n,
              tick: 'sat',
              amt,
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
