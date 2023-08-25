import { envDevelopment } from '@alex-b20/env';
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
  ]);

  console.log(`setup indexer done`);
}

setupIndexer().catch(console.error);
