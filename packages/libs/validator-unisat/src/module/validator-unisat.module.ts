import { ApiClientModule } from '@meta-protocols-oracle/api';
import { Module } from '@nestjs/common';
import ValidatorUnisatServiceProvider from './validator-unisat.service';

@Module({
  imports: [ApiClientModule],
  providers: [ValidatorUnisatServiceProvider],
  exports: [ValidatorUnisatServiceProvider],
})
export class ValidatorUnisatModule {}
