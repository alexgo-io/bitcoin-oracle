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
import { parseUnits } from 'viem';
import { env } from '../env';
import { getIndexerTxOnBlock$ } from '../validator/validator';

@Injectable()
export class DefaultValidatorUnisatService
  implements ValidatorProcessInterface
{
  private readonly logger = getLogger('validator-unisat');

  constructor(
    @Inject(ApiClientService) private readonly api: ApiClientService,
  ) {}

  processBlock$(block: number): Observable<unknown> {
    return getIndexerTxOnBlock$(block, this.api).pipe(
      concatMap(tx => {
        return from(
          this.submitIndexerTx(tx).catch(err => {
            getLogger('validator-unisat').error(
              `error submitting tx: ${
                tx.txid
              }, error: ${err}, tx: ${stringifyJSON(tx)}`,
            );
          }),
        );
      }),
    );
  }

  async submitIndexerTx(
    tx: Unobservable<ReturnType<typeof getIndexerTxOnBlock$>>,
  ) {
    const order_hash = generateOrderHash({
      amt: parseUnits(tx.amount, tx.decimals),
      decimals: BigInt(tx.decimals),
      from: Buffer.from(tx.from, 'hex'),
      to: Buffer.from(tx.to, 'hex'),
      'from-bal': parseUnits(tx.from_bal, tx.decimals),
      'to-bal': parseUnits(tx.to_bal, tx.decimals),
      'bitcoin-tx': Buffer.from(tx.tx, 'hex'),
      tick: tx.ticker,
      output: BigInt(tx.vout),
      offset: BigInt(tx.offset),
    });
    const signature = await signOrderHash(
      env().STACKS_VALIDATOR_ACCOUNT_SECRET,
      order_hash,
    );
    const pubkey = publicKeyToString(
      pubKeyfromPrivKey(env().STACKS_VALIDATOR_ACCOUNT_SECRET),
    );
    this.logger.verbose(`submitting ${tx.txid}`);

    return this.api
      .indexer()
      .txs()
      .post({
        type: Enums.ValidatorName.enum.unisat,
        header: tx.header,
        height: tx.height,
        tx_hash: tx.tx,
        satpoint: tx.offset.toString(),
        proof_hashes: tx.proof.hashes,
        tx_index: tx.proof['tx-index'].toString(10),
        tree_depth: tx.proof['tree-depth'].toString(10),
        from: tx.from,
        to: tx.to,
        output: tx.vout.toString(),
        tick: tx.ticker,
        amt: parseUnits(tx.amount, tx.decimals).toString(10),
        decimals: tx.decimals.toString(),
        from_bal: parseUnits(tx.from_bal, tx.decimals).toString(10),
        to_bal: parseUnits(tx.to_bal, tx.decimals).toString(10),
        order_hash: order_hash.toString('hex'),
        signature: signature.toString('hex'),
        signer: env().STACKS_VALIDATOR_ACCOUNT_ADDRESS,
        signer_pubkey: pubkey,
      });
  }
}

const ValidatorUnisatServiceProvider = {
  provide: ValidatorProcessInterface,
  useClass: DefaultValidatorUnisatService,
};

export default ValidatorUnisatServiceProvider;
