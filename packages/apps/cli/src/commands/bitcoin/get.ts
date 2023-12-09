import { getBitcoinBlockHeaderByHeight } from '@meta-protocols-oracle/bitcoin';
import { Command } from '@oclif/core';

export default class World extends Command {
  static description = 'a command';

  async run(): Promise<void> {
    for (let i = 820080; i < 820088; i++) {
      const header = await getBitcoinBlockHeaderByHeight(i);
      console.log(`header ${i}: ${JSON.stringify(header)}`);
    }

    // const data = await withElectrumClient(async client => {
    //   return getBitcoinTxDataWithStacks('ed8b6b32c847974bbf2b24354c256387294d4e89cc34c2a35c09e1433705e9d8', client)
    // })
    //
    // console.log(`data: ${JSON.stringify(data, null, 2)}`);
  }
}
