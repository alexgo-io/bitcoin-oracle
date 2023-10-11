import { Module } from '@nestjs/common';
import ValidatorHiroServiceProvider from './validator-hiro.service';

@Module({
  imports: [],
  providers: [ValidatorHiroServiceProvider],
  exports: [ValidatorHiroServiceProvider],
})
export class ValidatorHiroModule {}
