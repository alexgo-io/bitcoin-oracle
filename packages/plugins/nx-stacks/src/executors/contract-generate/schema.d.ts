import { EnvironmentOptions } from '../../utils/with-environment-vars';

export interface ContractGenerateTarget extends EnvironmentOptions {
  principal: string;
  contracts: string[];
  name: string;
  packageName?: string;
}
export interface ContractGenerateExecutorSchema extends EnvironmentOptions {
  targets: ContractGenerateTarget[];
  outputPath: string;
  stacksAPIURL: string;
}
