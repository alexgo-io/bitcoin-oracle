import { ExecutorContext } from '@nx/devkit';
import { generateContracts } from 'clarity-codegen/lib/generate';
import * as fs from 'fs-extra';
import * as path from 'path';
import { withEnvironmentVars } from '../../utils/with-environment-vars';
import { ContractGenerateExecutorSchema } from './schema';

export default async function runExecutor(
  options: ContractGenerateExecutorSchema,
  executorContext: ExecutorContext,
) {
  const { stacksAPIURL, targets, outputPath } = withEnvironmentVars(options);

  const absoluteOutputPath = path.resolve(executorContext.root, outputPath);
  fs.ensureDirSync(absoluteOutputPath);
  console.log(`generating contract with url: ${stacksAPIURL}`);

  for (let target of targets) {
    target = withEnvironmentVars(target);
    await generateContracts(
      stacksAPIURL,
      target.principal,
      target.contracts,
      absoluteOutputPath,
      target.name,
      target.packageName,
    );
  }

  return {
    success: true,
  };
}
