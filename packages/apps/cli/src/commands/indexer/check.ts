import { Logger } from '@nestjs/common';
import { Command, Flags } from '@oclif/core';

export default class Check extends Command {
  private readonly logger = new Logger(Check.name);

  static flags = {
    tx_id: Flags.string({
      required: true,
      char: 't',
    }),
  };

  async run(): Promise<void> {
    const {
      flags: { tx_id },
    } = await this.parse(Check);
    this.logger.log(`tx_id: ${tx_id}`);
  }
}
