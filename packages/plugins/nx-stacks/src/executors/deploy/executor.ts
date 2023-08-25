import { ExecutorContext, logger } from '@nx/devkit';
import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { deployContracts } from '../../utils/deployContracts';
import { processOperations } from '../../utils/processOperations';
import { withEnvironmentVars } from '../../utils/with-environment-vars';
import { DeployExecutorSchema } from './schema';

export default async function runExecutor(
  options: DeployExecutorSchema,
  context: ExecutorContext,
) {
  const {
    clarinetPath,
    contracts,
    deployerSecretKey,
    puppetURL,
    stacksAPIURL,
  } = withEnvironmentVars(options);
  assert(clarinetPath, 'clarinetPath is required');
  assert(contracts, 'contracts is required');
  assert(deployerSecretKey, 'deployerSecretKey is required');
  assert(puppetURL, 'puppetURL is required');
  assert(stacksAPIURL, 'stacksAPIURL is required');

  logger.info(`Deploying contracts: ${JSON.stringify(contracts)}`);

  const absoluteClarinetPath = path.resolve(context.root, clarinetPath);
  if (!fs.existsSync(absoluteClarinetPath)) {
    throw new Error(`Clarinet path ${absoluteClarinetPath} does not exist`);
  }

  const deployArtifacts = deployContracts(contracts, absoluteClarinetPath);

  await processOperations(deployerSecretKey, {
    stacksAPIURL,
    puppetURL,
    fee: 10e6,
  })(deployArtifacts);

  logger.debug(
    `Deployed contracts artifacts: ${JSON.stringify(
      deployArtifacts.map(t => t.name),
    )}`,
  );

  return {
    success: true,
  };
}
