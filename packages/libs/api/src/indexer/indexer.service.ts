import {
  callReadonlyWith,
  kIndexerContractName,
} from '@bitcoin-oracle/brc20-indexer';
import { fastRetry } from '@bitcoin-oracle/commons';
import { APIOf, ValidatorName } from '@bitcoin-oracle/types';
import { Inject } from '@nestjs/common';
import { env, getEnvStacksNetwork } from '../env';
import { Indexer, IndexerError } from './indexer.interface';
import { IndexerRepository } from './indexer.repository';

export class DefaultIndexer implements Indexer {
  private readonly callReadonly = callReadonlyWith(
    env().STACKS_DEPLOYER_ACCOUNT_ADDRESS,
    getEnvStacksNetwork(),
    env().STACKS_DEPLOYER_ACCOUNT_ADDRESS,
  );

  constructor(
    @Inject(IndexerRepository)
    private readonly indexerRepository: IndexerRepository,
  ) {}

  async upsertTxWithProof(tx: APIOf<'txs', 'request', 'dto'>) {
    await this.validateOrderHash(tx);
    return this.indexerRepository.upsertTxWithProof(tx);
  }

  async validateOrderHash(tx: APIOf<'txs', 'request', 'dto'>) {
    const serverOrderHash = await fastRetry(() =>
      this.callReadonly(kIndexerContractName, 'hash-tx', {
        tx: {
          output: tx.output,
          'bitcoin-tx': tx.tx_hash,
          offset: tx.satpoint,
          from: tx.from,
          to: tx.to,
          amt: tx.amt,
          'from-bal': tx.from_bal,
          'to-bal': tx.to_bal,
          tick: tx.tick,
        },
      }),
    );

    if (
      Buffer.from(serverOrderHash).toString('hex') !==
      tx.order_hash.toString('hex')
    ) {
      throw new IndexerError(
        `Order hash mismatch, hash from stacks-node: ${Buffer.from(
          serverOrderHash,
        ).toString('hex')} !== submitted hash: ${tx.order_hash.toString(
          'hex',
        )}`,
      );
    }
  }

  async getBlockByBlockHash(hash: string) {
    return await this.indexerRepository.getBlockByBlockHash(
      Buffer.from(hash, 'hex'),
    );
  }

  async getLatestBlockNumberOfProof(type: ValidatorName) {
    return (await this.indexerRepository.getLatestBlockNumberOfProof(type))
      .lasted_block_number;
  }

  async findDebugInfo(params: APIOf<'debug_txs', 'request', 'dto'>) {
    return await this.indexerRepository.findDebugInfo(params);
  }
}

const IndexerProvider = {
  provide: Indexer,
  useClass: DefaultIndexer,
};

export default IndexerProvider;
