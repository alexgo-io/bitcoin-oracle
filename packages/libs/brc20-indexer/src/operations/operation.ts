import { ClarityValue, TxBroadcastResult } from '@stacks/transactions';

export type OperationCallbackInput =
  | { type: 'error'; error: Error }
  | { type: 'success'; result: TxBroadcastResult };

export type Operation = DeployContract | PublicCall | TransferSTX;

export type TransferSTX = {
  type: 'transfer';
  amount: number;
  address: string;
  onBroadcast?: (result: TxBroadcastResult) => Promise<void>;
};

export type DeployContract = {
  type: 'deploy';
  name: string;
  path: string;
  onBroadcast?: (result: TxBroadcastResult) => Promise<void>;
};

export type PublicCall = {
  type: 'publicCall';
  contract: string;
  function: string;
  args: ClarityValue[];
  onBroadcast?: (result: TxBroadcastResult) => Promise<void>;
};
