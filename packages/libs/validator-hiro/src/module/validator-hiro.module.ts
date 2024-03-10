import { ApiClientModule } from '@meta-protocols-oracle/api';
import { Module } from '@nestjs/common';
import ValidatorHiroServiceProvider from './validator-hiro.service';

@Module({
  imports: [ApiClientModule],
  providers: [ValidatorHiroServiceProvider],
  exports: [ValidatorHiroServiceProvider],
})
export class ValidatorHiroModule {}
