import { ClarityValue, TxBroadcastResult } from '@stacks/transactions';

export type OperationCallbackInput =
  | { type: 'error'; error: Error }
  | { type: 'success'; result: TxBroadcastResult };

export type Operation = DeployContract | PublicCall | TransferSTX;

export type TransferSTX = {
  type: 'transfer';
  amount: number;
  address: string;
  options?: {
    fee?: number;
    onBroadcast?: (result: TxBroadcastResult) => Promise<void>;
    onSettled?: (op: TransferSTX) => Promise<void>;
  };};

export type DeployContract = {
  type: 'deploy';
  name: string;
  path: string;
  options?: {
    fee?: number;
    onBroadcast?: (result: TxBroadcastResult) => Promise<void>;
    onSettled?: (op: DeployContract) => Promise<void>;
  };};

export type PublicCall = {
  type: 'publicCall';
  contract: string;
  function: string;
  args: ClarityValue[];
  options?: {
    fee?: number;
    onBroadcast?: (result: TxBroadcastResult) => Promise<void>;
    onSettled?: (op: PublicCall) => Promise<void>;
  };
};
