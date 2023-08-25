import * as toml from '@iarna/toml';
import { ExecutorContext, logger } from '@nx/devkit';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ContractListGenerateExecutorSchema } from './schema';

export default async function runExecutor(
  options: ContractListGenerateExecutorSchema,
  executorContext: ExecutorContext,
) {
  const { outputPath, clarinetDirectoryGenerateTargets } = options;
  if (!clarinetDirectoryGenerateTargets) {
    logger.error('clarinetDirectoryGenerateTargets is undefined');
    return { success: false };
  }

  const absoluteOutputPath = path.resolve(executorContext.root, outputPath);
  if (!fs.existsSync(path.dirname(absoluteOutputPath))) {
    fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  }

  for (const target of clarinetDirectoryGenerateTargets) {
    const absoluteClarinetConfigPath = path.resolve(
      executorContext.root,
      target.clarinetConfigPath,
    );
    if (!fs.existsSync(absoluteClarinetConfigPath)) {
      throw new Error(
        `clarinet config file not found: ${absoluteClarinetConfigPath}`,
      );
    }

    const configs = toml.parse(
      fs.readFileSync(absoluteClarinetConfigPath, 'utf8'),
    );
    const outputJSONPath = path.resolve(
      executorContext.root,
      target.outputPath,
    );
    fs.ensureFileSync(outputJSONPath);
    fs.writeJSONSync(outputJSONPath, configs, { spaces: 2 });
  }

  return {
    success: true,
  };
}
