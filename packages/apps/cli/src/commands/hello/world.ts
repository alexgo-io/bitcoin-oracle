import { Args, Command, ux } from '@oclif/core';

export default class World extends Command {
  static description = 'Say hello world';

  static flags = {};

  static args = {
    arg1: Args.string({ description: 'an argument', required: true }),
  };
  async run(): Promise<void> {
    this.log('hello world!!!');

    ux.ux.action.start('start...');

    await new Promise(resolve => setTimeout(resolve, 5e3));

    ux.ux.action.stop('stop');
  }
}
