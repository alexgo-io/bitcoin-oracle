import { Module } from '@nestjs/common';
import ValidatorBisServiceProvider from './validator-hiro.service';

@Module({
  imports: [],
  providers: [ValidatorBisServiceProvider],
  exports: [ValidatorBisServiceProvider],
})
export class ValidatorHiroModule {}
