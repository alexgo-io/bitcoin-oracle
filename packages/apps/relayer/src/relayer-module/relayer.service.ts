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
    const indexedTxs: {
      'bitcoin-tx': Buffer;
      offset: bigint;
      output: bigint;
    }[] = [];

    const txErrors: {
      tx_hash: Buffer;
      satpoint: bigint;
      output: bigint;
      error: string;
    }[] = [];

    for (const tx of rows) {
      if (tx.tx_hash.length > 4096) {
        const tx_id = Transaction.fromRaw(tx.tx_id).id;
        this.logger.error(
          `tx_hash too long: ${tx.tx_hash.length}, tx_id: ${tx_id}, output: ${tx.output}, satpoint: ${tx.satpoint}`,
        );
        txErrors.push({
          satpoint: tx.satpoint,
          output: tx.output,
          tx_hash: tx.tx_hash,
          error: 'tx_hash too long (>4096)',
        });
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

          // error: the tx is not indexed yet
          if (isIndexedTx.type === 'error') {
            const firstProof = tx.proofs[0];
            let validateError = '';
            tx.proofs.forEach(proof => {
              if (
                proof.from.toString('hex') != firstProof.from.toString('hex')
              ) {
                validateError += `from: ${proof.from.toString('hex')}[${
                  proof.type
                }] != ${firstProof.from.toString('hex')}[${firstProof.type}].\n`;
              }
              if (proof.to.toString('hex') != firstProof.to.toString('hex')) {
                validateError += `to: ${proof.to.toString('hex')}[${
                  proof.type
                }] != ${firstProof.to.toString('hex')}[${firstProof.type}].\n`;
              }
              if (proof.amt != firstProof.amt) {
                validateError += `amt: ${proof.amt}[${proof.type}] != ${firstProof.amt}[${firstProof.type}].\n`;
              }
              if (proof.from_bal != firstProof.from_bal) {
                validateError += `from_bal: ${proof.from_bal}[${proof.type}] != ${firstProof.from_bal}[${firstProof.type}].\n`;
              }
              if (proof.to_bal != firstProof.to_bal) {
                validateError += `to_bal: ${proof.to_bal}[${proof.type}] != ${firstProof.to_bal}[${firstProof.type}].\n`;
              }
              if (proof.satpoint != firstProof.satpoint) {
                validateError += `satpoint: ${proof.satpoint}[${proof.type}] != ${firstProof.satpoint}[${firstProof.type}].\n`;
              }
              if (proof.output != firstProof.output) {
                validateError += `output: ${proof.output}[${proof.type}] != ${firstProof.output}[${firstProof.type}].\n`;
              }
              if (proof.tick != firstProof.tick) {
                validateError += `tick: ${proof.tick}[${proof.type}] != ${firstProof.tick}[${firstProof.type}].\n`;
              }
              if (
                proof.tx_id.toString('hex') != firstProof.tx_id.toString('hex')
              ) {
                validateError += `tx_id: ${proof.tx_id.toString('hex')}[${
                  proof.type
                }] != ${firstProof.tx_id.toString('hex')}[${firstProof.type}].\n`;
              }
              if (
                proof.order_hash.toString('hex') !=
                firstProof.order_hash.toString('hex')
              ) {
                validateError += `order_hash: ${proof.order_hash.toString(
                  'hex',
                )}[${proof.type}] != ${firstProof.order_hash.toString('hex')}[${
                  firstProof.type
                }].\n`;
              }
            });

            // mark the tx as error if any of the proofs does not match
            if (validateError.length > 0) {
              txErrors.push({
                satpoint: tx.satpoint,
                output: tx.output,
                tx_hash: tx.tx_hash,
                error: validateError,
              });
              return;
            }

            const signaturePacks = tx.proofs.map(proof => ({
              signature: proof.signature,
              signer: proof.signer,
              'tx-hash': proof.order_hash,
            }));

            const serverOrderHash = await fastRetry(() =>
              this.stacks.readonlyCaller()(kIndexerContractName, 'hash-tx', {
                tx: {
                  output: tx.output,
                  'bitcoin-tx': tx.tx_hash,
                  offset: tx.satpoint,
                  from: firstProof.from,
                  to: firstProof.to,
                  amt: firstProof.amt,
                  'from-bal': firstProof.from_bal,
                  'to-bal': firstProof.to_bal,
                  tick: firstProof.tick,
                },
              }),
            );

            const serverOrderHashBuffer = Buffer.from(serverOrderHash);
            if (
              serverOrderHashBuffer.toString('hex') !=
              firstProof.order_hash.toString('hex')
            ) {
              txErrors.push({
                satpoint: tx.satpoint,
                output: tx.output,
                tx_hash: tx.tx_hash,
                error: `!server_order_hash-mismatch: server: ${serverOrderHashBuffer.toString(
                  'hex',
                )} != proof: ${firstProof.order_hash.toString('hex')}`,
              });
              return;
            }

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
                from: firstProof.from,
                tick: firstProof.tick,
                'from-bal': firstProof.from_bal,
                'to-bal': firstProof.to_bal,
                to: firstProof.to,
                amt: firstProof.amt,
              },
              'signature-packs': signaturePacks,
            });
          } else {
            indexedTxs.push({
              'bitcoin-tx': tx.tx_hash,
              offset: tx.satpoint,
              output: tx.output,
            });
          }
        }),
      );
    }

    await queue.onIdle();

    if (indexedTxs.length > 0) {
      this.logger.log(
        `setAlreadyIndexed: ${indexedTxs.length} txs indexed by others`,
      );
      await this.relayerRepository.setAlreadyIndexed(indexedTxs);
    }

    if (txErrors.length > 0) {
      this.logger.log(`setTxs Error: ${txErrors.length} txs with errors`);
      await this.relayerRepository.setTxsWithError(txErrors);
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
