import { pubKeyfromPrivKey } from '@stacks/transactions';
import { kIndexerContractName, kIndexerRegistryName } from '../constants';
import { env, envTest } from '../env';
import { callPublic } from '../operations/operationFactory';
import { processOperations } from '../operations/processOperations';

export async function setupIndexer() {
  const process = processOperations(envTest().STACKS_DEPLOYER_ACCOUNT_SECRET, {
    stacksAPIURL: env().STACKS_API_URL,
    puppetURL: envTest().STACKS_PUPPET_URL,
  });

  await process([
    callPublic(kIndexerContractName, 'set-paused', { paused: false }),
    callPublic(kIndexerContractName, 'set-required-validators', {
      'new-required-validators': 1n,
    }),
    callPublic(kIndexerContractName, 'add-validator', {
      validator: envTest().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
      'validator-pubkey': pubKeyfromPrivKey(
        envTest().STACKS_VALIDATOR_ACCOUNT_SECRET,
      ).data,
    }),
    callPublic(kIndexerContractName, 'approve-relayer', {
      approved: true,
      relayer: envTest().STACKS_RELAYER_ACCOUNT_ADDRESS,
    }),
    callPublic(kIndexerRegistryName, 'approve-operator', {
      approved: true,
      operator: `${
        envTest().STACKS_DEPLOYER_ACCOUNT_ADDRESS
      }.${kIndexerContractName}`,
    }),
  ]);

  console.log(`setup indexer done`);
}

setupIndexer().catch(console.error);
