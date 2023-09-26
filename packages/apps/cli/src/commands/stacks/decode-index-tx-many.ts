#!/usr/bin/env ts-node

import { indexerContracts } from '@brc20-oracle/brc20-indexer';
import { stringifyJSON } from '@brc20-oracle/commons';
import { Command, Flags } from '@oclif/core';
import { hexToCV } from '@stacks/transactions';
import fs from 'fs';
import { cwd } from 'node:process';
import path from 'path';
export default class DecodeIndexTxMany extends Command {
  static description = 'Decode the input to indexer:index-tx-many';

  static flags = {
    version: Flags.version(),
    help: Flags.help(),
    input: Flags.string({
      char: 'i',
      required: true,
    }),
    output: Flags.string({
      char: 'o',
      required: true,
    }),
  };

  // static args = {
  //   hex: Args.string({ description: 'the input to indexer:index-tx-many', required: true }),
  // };

  async run(): Promise<void> {
    const { flags } = await this.parse(DecodeIndexTxMany);
    const hex = fs.readFileSync(flags.input).toString();

    const cv = hexToCV(hex);
    const val =
      indexerContracts['indexer']['index-tx-many'].input[0].type.decode(cv);

    fs.writeFileSync(path.resolve(cwd(), flags.output), stringifyJSON(val));

    this.log(
      `Decoded input to indexer:index-tx-many and saved to ${flags.output}`,
    );
  }
}
