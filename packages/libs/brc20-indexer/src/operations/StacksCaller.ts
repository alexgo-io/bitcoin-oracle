import {
  getEnvStacksChainID,
  getEnvStacksNetwork,
  getEnvStacksTransactionVersion,
} from '@meta-protocols-oracle/commons';
import { FeeCalculationFunc, Operation } from '@meta-protocols-oracle/types';
import { Logger } from '@nestjs/common';
import {
  TxBroadcastResult,
  getAddressFromPrivateKey,
} from '@stacks/transactions';
import { env } from '../env';
import { callReadonlyWith } from './operationFactory';
import { processOperations } from './processOperations';

export class StacksCaller {
  private readonly logger = new Logger(StacksCaller.name, { timestamp: true });
  readonly address: string;
  public operations: Operation[] = [];
  public fee?: number;
  public calculateFee?: FeeCalculationFunc;

  constructor(
    private readonly privateKey: string,
    readonly contractAddress: string,
  ) {
    this.address = getAddressFromPrivateKey(
      privateKey,
      getEnvStacksTransactionVersion(),
    );
  }

  private get process(): (operations: Operation[]) => Promise<number> {
    return processOperations(this.privateKey, {
      stacksAPIURL: env().STACKS_API_URL,
      chainID: getEnvStacksChainID(),
      contractAddress: this.contractAddress,
      fee: this.fee,
      puppetURL: env().STACKS_PUPPET_URL,
      didRBFBroadcast: this.didRBFBroadcast,
      calculateFee: this.calculateFee,
    });
  }

  public didRBFBroadcast: (params: {
    originalTxId: string;
    nonce: number;
    newTxId: string;
    fee?: number;
    broadcastResult: TxBroadcastResult;
  }) => Promise<void> = async () => {};

  readonlyCaller(): ReturnType<typeof callReadonlyWith> {
    return callReadonlyWith(
      this.address,
      getEnvStacksNetwork(),
      this.contractAddress,
    );
  }

  queueProcessOperation(operations: Operation[]) {
    this.operations.push(...operations);
  }

  async flushProcessOperation() {
    if (this.operations.length > 0) {
      const ops = this.operations;
      this.operations = [];

      try {
        this.logger.log(`Processing ${ops.length} operations`);
        await this.process(ops);
        this.logger.log(`Processed ${ops.length} operations`);
      } catch (e) {
        this.logger.error(`Failed to process operations: ${e}`);
      }
    }
  }
}
