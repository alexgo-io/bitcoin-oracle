import { Module } from '@nestjs/common';
import VaultServiceProvider from './vault.service';

@Module({
  imports: [],
  providers: [VaultServiceProvider],
  exports: [VaultServiceProvider],
})
export class VaultModule {}
