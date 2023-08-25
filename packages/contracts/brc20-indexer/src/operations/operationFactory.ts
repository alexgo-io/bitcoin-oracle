import { StacksNetwork } from '@stacks/network';
import { callReadOnlyFunction, TxBroadcastResult } from '@stacks/transactions';
import {
  OpenCallFunctionDescriptor,
  ParameterObjOfDescriptor,
  ReturnTypeOfDescriptor,
} from 'clarity-codegen';
import { ReadonlyFunctionDescriptor } from 'clarity-codegen/lib/runtime/contractBase';
import { indexer } from '../generated/contract_indexer';
import { PublicCall, TransferSTX } from './operation';

const contracts = indexer;
export type Contracts = typeof indexer;
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
  onBroadcast?: (result: TxBroadcastResult) => Promise<void>,
): PublicCall => {
  const descriptor = contracts[contractOrType][
    functionName
  ] as any as OpenCallFunctionDescriptor;
  return {
    type: 'publicCall',
    contract: contractOrType as string,
    function: functionName as string,
    args: descriptor.input.map(a => a.type.encode(args[a.name])),
    onBroadcast,
  };
};

export const callReadonlyWith =
  (senderAddress: string, network: StacksNetwork, contractAddress: string) =>
  async <
    T extends ContractName,
    F extends keyof Contracts[T],
    Descriptor extends Contracts[T][F],
  >(
    contractOrType: T,
    functionName: F,
    args: Contracts[T][F] extends ReadonlyFunctionDescriptor
      ? ParameterObjOfDescriptor<Contracts[T][F]>
      : never,
  ): Promise<ReturnTypeOfDescriptor<Descriptor>> => {
    const functionDescriptor = contracts[contractOrType][
      functionName
    ] as any as ReadonlyFunctionDescriptor;

    const clarityArgs = functionDescriptor.input.map(a =>
      a.type.encode(args[a.name]),
    );

    const res = await callReadOnlyFunction({
      network,
      senderAddress,
      contractAddress,
      contractName: contractOrType as string,
      functionName: functionName as string,
      functionArgs: clarityArgs,
    });

    return functionDescriptor.output.decode(res);
  };

export const transferStxTo = (
  address: string,
  amount: number,
  onBroadcast?: (result: any) => Promise<void>,
): TransferSTX => ({
  amount,
  address,
  type: 'transfer',
  onBroadcast,
});
