import { ApiClientService } from '@meta-protocols-oracle/api';
import {
  generateOrderHash,
  signOrderHash,
} from '@meta-protocols-oracle/brc20-indexer';
import {
  Unobservable,
  getLogger,
  stringifyJSON,
} from '@meta-protocols-oracle/commons';
import { Enums } from '@meta-protocols-oracle/types';
import { ValidatorProcessInterface } from '@meta-protocols-oracle/validator';
import { Inject, Injectable } from '@nestjs/common';
import { pubKeyfromPrivKey, publicKeyToString } from '@stacks/transactions';
import { Observable, concatMap, from } from 'rxjs';
import { env } from '../env';
import { getIndexerTxOnBlock$ } from '../validator/validator';

@Injectable()
export class DefaultValidatorHiroService implements ValidatorProcessInterface {
  private readonly logger = getLogger('validator-hiro');

  constructor(
    @Inject(ApiClientService) private readonly api: ApiClientService,
  ) {}

  async submitIndexerTx(
    tx: Unobservable<ReturnType<typeof getIndexerTxOnBlock$>>,
  ) {
    const order_hash = generateOrderHash({
      amt: tx.transfer_send.amount,
      decimals: tx.decimals,
      from: Buffer.from(tx.transfer_send.from_address, 'hex'),
      to: Buffer.from(tx.transfer_send.to_address, 'hex'),
      'from-bal': BigInt(tx.from_bal),
      'to-bal': BigInt(tx.to_bal),
      'bitcoin-tx': Buffer.from(tx.tx, 'hex'),
      tick: tx.ticker,
      output: BigInt(tx.location.vout),
      offset: BigInt(tx.location.satpoint),
    });
    const signature = await signOrderHash(
      env().STACKS_VALIDATOR_ACCOUNT_SECRET,
      order_hash,
    );

    this.logger.verbose(`submitting ${tx.tx_id}`);
    const pubkey = publicKeyToString(
      pubKeyfromPrivKey(env().STACKS_VALIDATOR_ACCOUNT_SECRET),
    );

    return this.api
      .indexer()
      .txs()
      .post({
        type: Enums.ValidatorName.enum.hiro,
        header: tx.header,
        height: tx.height,
        tx_hash: tx.tx,
        satpoint: tx.location.satpoint.toString(),
        proof_hashes: tx.proof.hashes,
        tx_index: tx.proof['tx-index'].toString(10),
        tree_depth: tx.proof['tree-depth'].toString(10),
        from: tx.transfer_send.from_address,
        to: tx.transfer_send.to_address,
        output: tx.location.vout.toString(),
        tick: tx.ticker,
        amt: tx.transfer_send.amount.toString(),
        decimals: tx.decimals.toString(),
        from_bal: tx.from_bal.toString(),
        to_bal: tx.to_bal.toString(),
        order_hash: order_hash.toString('hex'),
        signature: signature.toString('hex'),
        signer: env().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
        signer_pubkey: pubkey,
      });
  }

  processBlock$(block: number): Observable<unknown> {
    return getIndexerTxOnBlock$(block, this.api).pipe(
      concatMap(tx => {
        return from(
          this.submitIndexerTx(tx).catch(err => {
            getLogger('validator-hiro').error(
              `error submitting tx: ${
                tx.tx_id
              }, error: ${err}, tx: ${stringifyJSON(tx)}`,
            );
          }),
        );
      }),
    );
  }
}

const ValidatorHiroServiceProvider = {
  provide: ValidatorProcessInterface,
  useClass: DefaultValidatorHiroService,
};

export default ValidatorHiroServiceProvider;
