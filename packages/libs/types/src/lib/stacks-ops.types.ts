import { MempoolTransaction } from '@stacks/stacks-blockchain-api-types';
import { ClarityValue, TxBroadcastResult } from '@stacks/transactions';
import { z } from 'zod';

export type OperationCallbackInput =
  | { type: 'error'; error: Error }
  | { type: 'success'; result: TxBroadcastResult };

export type Operation = DeployContract | PublicCall | TransferSTX;

export type CallbackOptions = { nonce: number; fee?: number };

export type TransferSTX = {
  type: 'transfer';
  amount: number;
  address: string;
  options?: {
    feeOverride?: number;
    onBroadcast?: (
      result: TxBroadcastResult,
      options: CallbackOptions,
    ) => Promise<void>;
    onSettled?: (op: TransferSTX) => Promise<void>;
  };
};

export type DeployContract = {
  type: 'deploy';
  name: string;
  path: string;
  options?: {
    feeOverride?: number;
    onBroadcast?: (
      result: TxBroadcastResult,
      options: CallbackOptions,
    ) => Promise<void>;
    onSettled?: (op: DeployContract) => Promise<void>;
  };
};

export type PublicCall = {
  type: 'publicCall';
  contract: string;
  function: string;
  args: ClarityValue[];
  options?: {
    feeOverride?: number;
    onBroadcast?: (
      result: TxBroadcastResult,
      options: CallbackOptions,
    ) => Promise<void>;
    onSettled?: (op: PublicCall) => Promise<void>;
  };
};

export type FeeCalculationTx =
  | {
      type: 'operation';
      operation: PublicCall;
    }
  | {
      type: 'mempool';
      tx: MempoolTransaction;
      currentFee: number;
    };

export type FeeCalculationFunc = (
  tx: FeeCalculationTx,
) => Promise<number | null>;

export const StacksRBFModeSchema = z
  .enum(['stages', 'estimate', 'function', 'off'])
  .default('off');

export const ConflictingNonceStrategySchema = z
  .enum(['increase', 'replace'])
  .default('increase');
