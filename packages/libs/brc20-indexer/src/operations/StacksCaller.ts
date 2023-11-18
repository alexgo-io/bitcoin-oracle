import { Logger } from '@nestjs/common';
import {
  getAddressFromPrivateKey,
  TxBroadcastResult,
} from '@stacks/transactions';
import {
  env,
  getEnvStacksChainID,
  getEnvStacksNetwork,
  getEnvStacksTransactionVersion,
} from '../env';
import { Operation } from './operation';
import { callReadonlyWith } from './operationFactory';
import { processOperations } from './processOperations';

export class StacksCaller {
  private readonly logger = new Logger(StacksCaller.name, { timestamp: true });
  readonly address: string;
  public operations: Operation[] = [];

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
      feeMultiplier: 2,
      puppetURL: env().STACKS_PUPPET_URL,
      didRBFBroadcast: this.didRBFBroadcast,
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
