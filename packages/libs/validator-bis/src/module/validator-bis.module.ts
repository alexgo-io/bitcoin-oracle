import { Module } from '@nestjs/common';
import ValidatorBisServiceProvider from './validator-bis.service';

@Module({
  imports: [],
  providers: [ValidatorBisServiceProvider],
  exports: [ValidatorBisServiceProvider],
})
export class ValidatorBisModule {}
