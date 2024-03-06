import { PersistentModule } from '@meta-protocols-oracle/persistent';
import { Module } from '@nestjs/common';
import { VaultRepository } from './vault.repository';
import VaultServiceProvider from './vault.service';

@Module({
  imports: [PersistentModule],
  providers: [VaultServiceProvider, VaultRepository],
  exports: [VaultServiceProvider],
})
export class VaultModule {}
