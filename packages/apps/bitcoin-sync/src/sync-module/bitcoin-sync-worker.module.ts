import { OtlpBitcoinSyncModule } from '@bitcoin-oracle/instrument';
import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { PersistentModule } from '@meta-protocols-oracle/persistent';
import { Module } from '@nestjs/common';
import { BitcoinSyncWorkerService } from './bitcoin-sync-worker.interface';
import { BitcoinSyncWorkerRepository } from './bitcoin-sync-worker.repository';
import BitcoinSyncWorkerProvider from './bitcoin-sync-worker.service';

@Module({
  imports: [PersistentModule, PinoLoggerModule, OtlpBitcoinSyncModule],
  providers: [BitcoinSyncWorkerProvider, BitcoinSyncWorkerRepository],
  exports: [BitcoinSyncWorkerService],
})
export class BitcoinSyncWorkerModule {}
