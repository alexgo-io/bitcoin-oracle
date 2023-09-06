import { Logger } from '@nestjs/common';
import { getAddressFromPrivateKey } from '@stacks/transactions';
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
  private readonly process: (operations: Operation[]) => Promise<number>;
  public operations: Operation[] = [];

  constructor(
    private readonly privateKey: string,
    readonly contractAddress: string,
    options?: { fee?: number; minFee?: number },
  ) {
    this.address = getAddressFromPrivateKey(
      privateKey,
      getEnvStacksTransactionVersion(),
    );
    this.process = processOperations(this.privateKey, {
      stacksAPIURL: env().STACKS_API_URL,
      chainID: getEnvStacksChainID(),
      contractAddress,
      fee: options?.fee,
      minFee: options?.minFee ?? 0.0525e6,
      puppetURL: env().STACKS_PUPPET_URL,
    });
  }

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
