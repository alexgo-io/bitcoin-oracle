import {
  callPublic,
  indexerContracts,
  kIndexerContractName,
  kIndexerRegistryName,
  StacksCaller,
} from '@bitcoin-oracle/brc20-indexer';
import { fastRetry, noAwait, toBuffer } from '@bitcoin-oracle/commons';
import { Inject, Logger } from '@nestjs/common';
import { chunk } from 'lodash';
import PQueue from 'p-queue';
import { exhaustMap, from, interval } from 'rxjs';
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
  ) {
    this.stacks.didRBFBroadcast = async ({ newTxId, nonce }) => {
      await this.relayerRepository.onRBFTx({
        newTxId: Buffer.from(newTxId),
        nonce,
        submitted_by: env().STACKS_RELAYER_ACCOUNT_ADDRESS,
      });
    };
  }

  async startRelayer() {
    interval(env().RELAYER_SYNC_POLL_INTERVAL)
      .pipe(
        exhaustMap(() => {
          return from(this.syncOnce());
        }),
      )
      .subscribe();
  }

  async syncOnce(): Promise<void> {
    const pendingTxs = await this.relayerRepository.getPendingSubmitTx();
    const rows = pendingTxs.rows;

    const TxManyInputEncoder =
      indexerContracts[kIndexerContractName]['index-tx-many']['input'][0].type
        .encode;
    type TxManyInput = Parameters<typeof TxManyInputEncoder>[0][number];
    const txManyInputs: TxManyInput[] = [];
    this.logger.log(`processing: ${rows.length} rows transactions`);

    const queue = new PQueue({ concurrency: 25 });
    const indexed: { 'bitcoin-tx': Buffer; offset: bigint; output: bigint }[] =
      [];

    for (const tx of rows) {
      if (tx.tx_hash.length > 4096) {
        const tx_id = Transaction.fromRaw(tx.tx_id).id;
        this.logger.error(
          `tx_hash too long: ${tx.tx_hash.length}, tx_id: ${tx_id}, output: ${tx.output}, satpoint: ${tx.satpoint}`,
        );
        continue;
      }
      noAwait(
        queue.add(async () => {
          const isIndexedTx = await fastRetry(
            () =>
              this.stacks.readonlyCaller()(
                kIndexerRegistryName,
                'get-bitcoin-tx-indexed-or-fail',
                {
                  'bitcoin-tx': tx.tx_hash,
                  offset: tx.satpoint,
                  output: tx.output,
                },
              ),
            'get-bitcoin-tx-indexed-or-fail',
          );

          // TODO: check error code in mainnet
          if (isIndexedTx.type === 'error') {
            const signaturePacks = tx.proofs.map(proof => ({
              signature: proof.signature,
              signer: proof.signer,
              'tx-hash': proof.order_hash,
            }));
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
                'bitcoin-tx': tx.tx_hash,
                from: tx.from,
                tick: tx.tick,
                'from-bal': tx.from_bal,
                'to-bal': tx.to_bal,
                to: tx.to,
                amt: tx.amt,
              },
              'signature-packs': signaturePacks,
            });
          } else {
            indexed.push({
              'bitcoin-tx': tx.tx_hash,
              offset: tx.satpoint,
              output: tx.output,
            });
          }
        }),
      );
    }

    await queue.onIdle();

    if (indexed.length > 0) {
      this.logger.log(
        `setAlreadyIndexed: ${indexed.length} txs indexed by others`,
      );
      await this.relayerRepository.setAlreadyIndexed(indexed);
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
          {
            onSettled: () =>
              this.relayerRepository.upsertSubmittedTx(
                inputs.map(input => ({
                  tx_hash: Buffer.from(input.tx['bitcoin-tx']),
                  satpoint: input.tx.offset,
                  output: input.tx.output,
                  broadcast_result_type: 'settled',
                })),
              ),
            onBroadcast: (result, options) =>
              this.relayerRepository.upsertSubmittedTx(
                inputs.map(input => ({
                  tx_hash: Buffer.from(input.tx['bitcoin-tx']),
                  satpoint: input.tx.offset,
                  output: input.tx.output,
                  stacks_tx_id:
                    result.txid == null ? null : toBuffer(result.txid),
                  broadcast_result_type: result.error == null ? 'ok' : 'error',
                  error: result.error == null ? null : result.error,
                  submitted_by: env().STACKS_RELAYER_ACCOUNT_ADDRESS,
                  submitter_nonce: BigInt(options.nonce),
                  submitted_at: new Date(),
                })),
              ),
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
