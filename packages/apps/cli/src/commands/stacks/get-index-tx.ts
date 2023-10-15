import {
  StacksCaller,
  kIndexerRegistryName,
} from '@meta-protocols-oracle/brc20-indexer';
import { stringifyJSON } from '@meta-protocols-oracle/commons';
import { Command, Flags } from '@oclif/core';
import { env } from '../../env';

export default class World extends Command {
  static description = 'Say hello world';
  private readonly stacks = new StacksCaller(
    env().STACKS_RELAYER_ACCOUNT_SECRET!,
    env().STACKS_DEPLOYER_ACCOUNT_ADDRESS!,
  );
  static flags = {
    tx_hash: Flags.string({ required: true }),
    satpoint: Flags.string({ required: true }),
    output: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const {
      flags: { output, satpoint, tx_hash },
    } = await this.parse(World);

    const result = await this.stacks.readonlyCaller()(
      kIndexerRegistryName,
      'get-bitcoin-tx-indexed-or-fail',
      {
        'bitcoin-tx': Buffer.from(tx_hash, 'hex'),
        offset: BigInt(satpoint),
        output: BigInt(output),
      },
    );

    this.log(`result: ${stringifyJSON(result)} `);
  }
}
