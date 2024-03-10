import { ApiClientModule } from '@meta-protocols-oracle/api';
import { Module } from '@nestjs/common';
import ValidatorBisServiceProvider from './validator-bis.service';

@Module({
  imports: [ApiClientModule],
  providers: [ValidatorBisServiceProvider],
  exports: [ValidatorBisServiceProvider],
})
export class ValidatorBisModule {}
