import { CallbackOptions, PublicCall } from '@meta-protocols-oracle/types';
import { StacksNetwork } from '@stacks/network';
import { TxBroadcastResult, callReadOnlyFunction } from '@stacks/transactions';
import {
  OpenCallFunctionDescriptor,
  ParameterObjOfDescriptor,
  ReturnTypeOfDescriptor,
} from 'clarity-codegen';
import { ReadonlyFunctionDescriptor } from 'clarity-codegen/lib/runtime/contractBase';
import { OracleContracts } from '../generated';

const contracts = OracleContracts;
export type Contracts = typeof contracts;
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
  options?: {
    onBroadcast?: (
      result: TxBroadcastResult,
      options: CallbackOptions,
    ) => Promise<void>;
    onSettled?: (op: PublicCall) => Promise<void>;
  },
): PublicCall => {
  const descriptor = contracts[contractOrType][
    functionName
  ] as unknown as OpenCallFunctionDescriptor;
  return {
    type: 'publicCall',
    contract: contractOrType as string,
    function: functionName as string,
    args: descriptor.input.map(a => a.type.encode(args[a.name])),
    options,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
