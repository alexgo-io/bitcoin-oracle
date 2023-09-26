import {
  OpenCallFunctionDescriptor,
  ParameterObjOfDescriptor,
} from 'clarity-codegen';
import { Brc20IndexerContracts } from './generated/contracts_Brc20Indexer';
import { Operation } from './operation';

export type Contracts = typeof Brc20IndexerContracts;
export type ContractName = keyof Contracts;

export const callPublic = <
  T extends ContractName,
  F extends keyof Contracts[T],
>(
  contractOrType: T,
  functionName: F,
  args: Contracts[T][F] extends OpenCallFunctionDescriptor
    ? ParameterObjOfDescriptor<Contracts[T][F]>
    : never,
): Operation.PublicCall => {
  const descriptor = Brc20IndexerContracts[contractOrType][
    functionName
  ] as any as OpenCallFunctionDescriptor;
  return {
    type: 'publicCall',
    contract: contractOrType as string,
    function: functionName as string,
    args: descriptor.input.map(a => a.type.encode(args[a.name])),
  };
};

export const transferStxTo = (
  address: string,
  amount: number,
): Operation.TransferSTX => ({ amount, address, type: 'transfer' });
