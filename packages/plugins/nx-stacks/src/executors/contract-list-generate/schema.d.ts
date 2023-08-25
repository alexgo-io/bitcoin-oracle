export interface ClarinetDirectoryGenerateTarget {
  clarinetConfigPath: string;
  outputPath: string;
}
export interface ContractListGenerateExecutorSchema {
  outputPath: string;

  clarinetDirectoryGenerateTargets: ClarinetDirectoryGenerateTarget[];
}
