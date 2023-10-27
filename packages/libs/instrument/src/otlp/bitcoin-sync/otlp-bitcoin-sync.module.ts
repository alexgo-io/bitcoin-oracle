import { Module } from '@nestjs/common';
import OtlpBitcoinSyncServiceProvider from './otlp-bitcoin-sync.service';

@Module({
  imports: [],
  providers: [OtlpBitcoinSyncServiceProvider],
  exports: [OtlpBitcoinSyncServiceProvider],
})
export class OtlpBitcoinSyncModule {}
