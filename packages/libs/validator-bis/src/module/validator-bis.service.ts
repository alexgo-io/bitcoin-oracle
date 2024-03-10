import { ApiClientService } from '@meta-protocols-oracle/api';
import {
  generateOrderHash,
  signOrderHash,
} from '@meta-protocols-oracle/brc20-indexer';
import { Unobservable } from '@meta-protocols-oracle/commons';
import { BufferHexSchema, Enums } from '@meta-protocols-oracle/types';
import { ValidatorProcessInterface } from '@meta-protocols-oracle/validator';
import { Inject, Logger } from '@nestjs/common';
import { pubKeyfromPrivKey, publicKeyToString } from '@stacks/transactions';
import assert from 'assert';
import { Observable, concatMap, from } from 'rxjs';
import { Transaction } from 'scure-btc-signer-cjs';
import { env } from '../env';
import { getIndexerTxOnBlock$ } from '../validator/validator';

export class DefaultValidatorBisService implements ValidatorProcessInterface {
  private readonly logger = new Logger('validator-bis');
  private heightCounter: Record<string, number> = {};

  constructor(
    @Inject(ApiClientService) private readonly api: ApiClientService,
  ) {}

  processBlock$(block: number): Observable<unknown> {
    return getIndexerTxOnBlock$(block, this.api).pipe(
      concatMap(tx => {
        this.heightCounter[tx.height] =
          (this.heightCounter[tx.height] ?? 0) + 1;
        const count = this.heightCounter[tx.height];
        this.logger.verbose(
          `submitting tx: ${tx.tx_id} - ${tx.height} - ${count}`,
        );
        return from(this.submitIndexerTx(tx));
      }),
    );
  }

  async submitIndexerTx(
    tx: Unobservable<ReturnType<typeof getIndexerTxOnBlock$>>,
  ) {
    assert(
      tx.old_pkscript != null,
      `old_pkscript is null for ${tx.tx_id}, inscription_id: ${tx.inscription_id}`,
    );

    const order_hash = generateOrderHash({
      amt: BigInt(tx.amount),
      decimals: BigInt(tx.decimals),
      from: BufferHexSchema.parse(tx.old_pkscript),
      to: BufferHexSchema.parse(tx.new_pkscript),
      'from-bal': BigInt(tx.from_bal),
      'to-bal': BigInt(tx.to_bal),
      'bitcoin-tx': Buffer.from(tx.tx, 'hex'),
      tick: tx.tick,
      output: BigInt(tx.vout),
      offset: BigInt(tx.satpoint),
    });
    const signature = await signOrderHash(
      env().STACKS_VALIDATOR_ACCOUNT_SECRET,
      order_hash,
    );
    const pubkey = publicKeyToString(
      pubKeyfromPrivKey(env().STACKS_VALIDATOR_ACCOUNT_SECRET),
    );

    try {
      Buffer.from(
        Transaction.fromRaw(BufferHexSchema.parse(tx.tx), {
          allowUnknownOutputs: true,
        }).id,
        'hex',
      );
    } catch (e) {
      this.logger.error(`failed to parse tx skip: ${tx.tx_id}, ${e}`);
      return null;
    }

    return this.api
      .indexer()
      .txs()
      .post({
        type: Enums.ValidatorName.enum.bis,
        header: tx.header,
        height: tx.height,
        tx_hash: tx.tx,
        satpoint: tx.satpoint,
        proof_hashes: tx.proof.hashes,
        tx_index: tx.proof['tx-index'].toString(10),
        tree_depth: tx.proof['tree-depth'].toString(10),
        from: tx.old_pkscript ?? '', // TODO: refine model
        to: tx.new_pkscript ?? '', // TODO: refine model
        output: tx.vout,
        tick: tx.tick,
        amt: tx.amount,
        decimals: tx.decimals.toString(10),
        from_bal: tx.from_bal,
        to_bal: tx.to_bal,
        order_hash: order_hash.toString('hex'),
        signature: signature.toString('hex'),
        signer: env().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
        signer_pubkey: pubkey,
      });
  }
}

const ValidatorBisServiceProvider = {
  provide: ValidatorProcessInterface,
  useClass: DefaultValidatorBisService,
};

export default ValidatorBisServiceProvider;
