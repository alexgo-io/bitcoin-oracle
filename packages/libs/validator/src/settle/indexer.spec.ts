import { callPublic, processOperations, signTx } from '@alex-b20/brc20-indexer';
import { envDevelopment } from '@alex-b20/env';
import { bufferCV } from '@stacks/transactions';

describe('Indexer', () => {
  it('should index tx', async () => {
    const bisData = {
      activity_type: 'transfer-transfer',
      amount: '10000000000000000000000',
      id: 28093931,
      inscription_id:
        '6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666ai0',
      tx_id: '6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666a',
      new_pkscript: '0014ad42179475826f3cae94c1c3bae2797c6933a53a',
      new_wallet: 'bc1q44pp09r4sfhnet55c8pm4cne035n8ff6t0lhgz',
      old_pkscript: '0014870dba15d6b5a0563b6df472359a7ef75d21f26c',
      old_wallet: 'bc1qsuxm59wkkks9vwmd73ertxn77awjrunv8x0nv6',
      tick: 'rdex',
    } as const;

    const process = processOperations(
      envDevelopment.STACKS_DEPLOYER_ACCOUNT_SECRET,
      {
        stacksAPIURL: envDevelopment.STACKS_API_URL,
        puppetURL: envDevelopment.STACKS_PUPPET_URL,
        fee: 2e3,
      },
    );

    const signature = await signTx(
      envDevelopment.STACKS_VALIDATOR_ACCOUNT_SECRET,
      bufferCV(Buffer.from(bisData.tx_id, 'hex')),
    );

    await process([
      callPublic('indexer', 'index-tx-many', {
        'tx-many': [
          {
            block: {
              header: Buffer.from(''),
              height: 100n,
            },
            proof: {
              hashes: [Buffer.from('')],
              'tree-depth': 1n,
              'tx-index': 2n,
            },
            tx: {
              from: Buffer.from(bisData.old_wallet),
              to: Buffer.from(bisData.new_wallet),
              output: 10n,
              tick: 'sat',
              amt: 1000n,
              'bitcoin-tx': Buffer.from(
                '000000000000000000037299db1bd5b0872f8379d9971fcca36171825ee9cc83',
              ),
              'from-bal': BigInt(bisData.amount),
              'to-bal': BigInt(bisData.amount),
            },
            'signature-packs': [
              {
                signature: signature,
                signer: envDevelopment.STACKS_VALIDATOR_ACCOUNT_ADDRESS,
                'tx-hash': Buffer.from(bisData.tx_id, 'hex'),
              },
            ],
          },
        ],
      }),
    ]);
  });
});
