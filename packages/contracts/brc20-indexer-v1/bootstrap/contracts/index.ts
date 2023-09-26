import { DEPLOYER_ACCOUNT_ADDRESS } from '../constants';
import { Brc20IndexerContracts } from './generated/contracts_Brc20Indexer';

export type Contracts = typeof Brc20IndexerContracts;
export type ContractName = keyof Contracts;

export function contractName<T extends ContractName>(name: T): T {
  return name;
}

export function principal<T extends ContractName>(contract: T) {
  return `${DEPLOYER_ACCOUNT_ADDRESS()}.${String(contract)}`;
}
