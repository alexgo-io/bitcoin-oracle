import { VaultModule, VaultService } from '@meta-protocols-oracle/api';
import { NestFactory } from '@nestjs/core';
import { Command, Flags } from '@oclif/core';

export default class Create extends Command {
  static flags = {
    role: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const {
      flags: { role },
    } = await this.parse(Create);

    const m = await NestFactory.createMicroservice(VaultModule);
    const svc = m.get(VaultService);

    await svc.appRole.createOrUpdateAppRole(role, {});
  }
}
