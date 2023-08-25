import * as toml from '@iarna/toml';
import * as fs from 'fs';
import { uniq } from 'lodash';
import * as path from 'path';
import { DeployContract } from './operation';

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
  const contracts = clarinetConfig['contracts'] as Contracts;
  // swap out the dao one with mock
  // contracts['age000-governance-token'] = contracts['token-t-alex']!;
  const contractsKeys = Object.keys(contracts).filter(c =>
    contractNames.includes(c),
  );
  function findDeps(name: string): string[] {
    if (!contracts[name]) {
      throw new Error(`Could not find contract ${name}`);
    }
    const contract = contracts[name]!.depends_on;
    if (contract == null) {
      return [name];
    }
    if (contract.includes('executor-dao')) {
      throw new Error(`${name} has executor-dao as a dependency`);
    }
    return [...contract.flatMap(findDeps), name];
  }
  const sortedContractNames = uniq(contractsKeys.flatMap(findDeps));
  return sortedContractNames.map((contractName: any) => {
    return {
      contractName,
      contractPath: path.resolve(clarinetPath, contracts[contractName]!.path),
    };
  });
};

export function deployContracts(
  contracts: string[],
  clarinetPath: string,
): DeployContract[] {
  const result = mapContractsToDeployTarget(contracts, {
    clarinetPath,
  });
  console.log(`Found ${result.length} deploy targets`);
  return result.map(r => ({
    type: 'deploy',
    path: r.contractPath,
    name: r.contractName,
  }));
}
