import { envDevelopment } from '@alex-b20/env';
import { pubKeyfromPrivKey } from '@stacks/transactions';
import { callPublic } from '../operations/operationFactory';
import { processOperations } from '../operations/processOperations';

export async function setupIndexer() {
  const process = processOperations(
    envDevelopment.STACKS_DEPLOYER_ACCOUNT_SECRET,
    {
      stacksAPIURL: envDevelopment.STACKS_API_URL,
      puppetURL: envDevelopment.STACKS_PUPPET_URL,
    },
  );

  await process([
    callPublic('indexer', 'set-paused', { paused: false }),
    callPublic('indexer', 'set-required-validators', {
      'new-required-validators': 1n,
    }),
    callPublic('indexer', 'add-validator', {
      validator: envDevelopment.STACKS_VALIDATOR_ACCOUNT_ADDRESS,
      'validator-pubkey': pubKeyfromPrivKey(
        envDevelopment.STACKS_VALIDATOR_ACCOUNT_SECRET,
      ).data,
    }),
    callPublic('indexer', 'approve-relayer', {
      approved: true,
      relayer: envDevelopment.STACKS_RELAYER_ACCOUNT_ADDRESS,
    }),
    callPublic('indexer-registry', 'approve-operator', {
      approved: true,
      operator: envDevelopment.STACKS_RELAYER_ACCOUNT_ADDRESS,
    }),
  ]);

  console.log(`setup indexer done`);
}

setupIndexer().catch(console.error);
