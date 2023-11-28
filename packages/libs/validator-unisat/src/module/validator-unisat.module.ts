import { Module } from '@nestjs/common';
import ValidatorUnisatServiceProvider from './validator-unisat.service';

@Module({
  imports: [],
  providers: [ValidatorUnisatServiceProvider],
  exports: [ValidatorUnisatServiceProvider],
})
export class ValidatorUnisatModule {}
