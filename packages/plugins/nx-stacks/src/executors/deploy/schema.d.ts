export interface DeployExecutorSchema extends Record<string, unknown> {
  contracts: string[];
  clarinetPath: string;
  deployerSecretKey: string;
  stacksAPIURL: string;
  puppetURL: string;
}
