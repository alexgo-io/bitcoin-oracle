import { ClarityValue } from '@stacks/transactions';

export type Operation =
  | Operation.DeployContract
  | Operation.PublicCall
  | Operation.TransferSTX;

export namespace Operation {
  export type TransferSTX = {
    type: 'transfer';
    amount: number;
    address: string;
  };

  export type DeployContract = {
    type: 'deploy';
    name: string;
    path: string;
  };

  export type PublicCall = {
    type: 'publicCall';
    contract: string;
    function: string;
    args: ClarityValue[];
  };
}
