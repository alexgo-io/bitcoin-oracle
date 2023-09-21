import {
  callPublic,
  indexerContracts,
  kIndexerContractName,
  kIndexerRegistryName,
  StacksCaller,
} from '@alex-b20/brc20-indexer';
import { toBuffer } from '@alex-b20/commons';
import { Inject, Logger } from '@nestjs/common';
import { chunk } from 'lodash';
import { Transaction } from 'scure-btc-signer-cjs';
import { env } from '../env';
import { RelayerService } from './relayer.interface';
import { RelayerRepository } from './relayer.repository';

export class DefaultRelayerService implements RelayerService {
  private readonly stacks = new StacksCaller(
    env().STACKS_RELAYER_ACCOUNT_SECRET,
    env().STACKS_DEPLOYER_ACCOUNT_ADDRESS,
  );
  private readonly logger = new Logger(RelayerService.name);
  constructor(
    @Inject(RelayerRepository)
    public readonly relayerRepository: RelayerRepository,
  ) {}

  async startRelayer(): Promise<void> {
    const pendingTxs = await this.relayerRepository.getPendingSubmitTx();
    const rows = pendingTxs.rows;

    const TxManyInputEncoder =
      indexerContracts[kIndexerContractName]['index-tx-many']['input'][0].type
        .encode;
    type TxManyInput = Parameters<typeof TxManyInputEncoder>[0][number];
    const txManyInputs: TxManyInput[] = [];

    for (const tx of rows) {
      if (tx.tx_id.length > 4096) {
        const tx_id = Transaction.fromRaw(tx.tx_id).id;
        this.logger.error(
          `tx_id too long: ${tx.tx_id.length}, tx_id: ${tx_id}, output: ${tx.output}, satpoint: ${tx.satpoint}`,
        );
        continue;
      }
      console.log(`hash size; ${tx.tx_id.length}`);
      const isIndexedTx = await this.stacks.readonlyCaller()(
        kIndexerRegistryName,
        'get-bitcoin-tx-indexed-or-fail',
        {
          'bitcoin-tx': tx.tx_id,
          offset: tx.satpoint,
          output: tx.output,
        },
      );

      // TODO: check error code in mainnet
      if (isIndexedTx.type === 'error') {
        // TODO: bundle proofs
        txManyInputs.push({
          block: {
            height: tx.height,
            header: tx.header,
          },
          proof: {
            'tx-index': tx.tx_index,
            'tree-depth': tx.tree_depth,
            hashes: tx.proof_hashes,
          },
          tx: {
            output: tx.output,
            offset: tx.satpoint,
            'bitcoin-tx': tx.tx_id,
            from: tx.from,
            tick: tx.tick,
            'from-bal': tx.from_bal,
            'to-bal': tx.to_bal,
            to: tx.to,
            amt: tx.amt,
          },
          'signature-packs': [
            {
              signature: tx.signature,
              signer: tx.signer,
              'tx-hash': tx.order_hash,
            },
          ],
        });
      }
    }

    const kChunkSize = 25;

    const chunkInputs = chunk(txManyInputs, kChunkSize);

    for (const inputs of chunkInputs) {
      this.stacks.queueProcessOperation([
        callPublic(
          kIndexerContractName,
          'index-tx-many',
          {
            'tx-many': inputs,
          },
          result => {
            return this.relayerRepository.upsertSubmittedTx(
              inputs.map(input => ({
                tx_id: Buffer.from(input.tx['bitcoin-tx']),
                satpoint: input.tx.offset,
                output: input.tx.output,
                stacks_tx_id:
                  result.txid == null ? null : toBuffer(result.txid),
                broadcast_result_type: result.error == null ? 'ok' : 'error',
                error: result.error == null ? null : result.error,
                submitted_by: env().STACKS_RELAYER_ACCOUNT_ADDRESS,
                submitted_at: new Date(),
              })),
            );
          },
        ),
      ]);
      this.logger.log(`Queued ${inputs.length} operations to 'index-tx-many'`);
    }

    await this.stacks.flushProcessOperation();
  }
}

const RelayerServiceProvider = {
  provide: RelayerService,
  useClass: DefaultRelayerService,
};

export default RelayerServiceProvider;
