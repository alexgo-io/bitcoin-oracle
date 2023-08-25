import toml from '@iarna/toml';
import fs from 'fs';
import { uniq } from 'lodash';
import path from 'path';
import { Operation } from '../contracts/operation';

type DeployContractTarget = {
  contractName: string;
  contractPath: string;
};

type Contracts = {
  [key: string]: {
    path: string;
    depends_on: string[];
  };
};

const mapContractsToDeployTarget = (
  contractNames: string[],
  { clarinetPath }: { clarinetPath: string },
): DeployContractTarget[] => {
  const clarinetConfig = toml.parse(
    fs.readFileSync(path.resolve(clarinetPath, 'Clarinet.toml'), 'utf8'),
  );
  const contracts = clarinetConfig.contracts as Contracts;
  function findDeps(name: string): string[] {
    if (!contracts[name]) {
      throw new Error(`Could not find contract ${name}`);
    }
    const contract = contracts[name].depends_on ?? [];
    return [...contract.flatMap(findDeps), name];
  }
  const sortedContractNames = uniq(contractNames.flatMap(findDeps));
  return sortedContractNames.map(contractName => {
    return {
      contractName,
      contractPath: path.resolve(clarinetPath, contracts[contractName].path),
    };
  });
};

export function deployContracts(
  contracts: string[],
  clarinetPath: string,
): Operation.DeployContract[] {
  const result = mapContractsToDeployTarget(contracts, {
    clarinetPath,
  });
  console.log(
    `Found ${result.length} deploy targets: ${result
      .map(r => r.contractName)
      .join(', ')}`,
  );
  return result.map(r => ({
    type: 'deploy',
    path: r.contractPath,
    name: r.contractName,
  }));
}
