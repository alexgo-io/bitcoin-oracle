import { PinoLoggerModule } from '@brc20-oracle/commons';
import { PersistentModule } from '@brc20-oracle/persistent';
import { Module } from '@nestjs/common';
import { BitcoinSyncWorkerService } from './bitcoin-sync-worker.interface';
import { BitcoinSyncWorkerRepository } from './bitcoin-sync-worker.repository';
import BitcoinSyncWorkerProvider from './bitcoin-sync-worker.service';

@Module({
  imports: [PersistentModule, PinoLoggerModule],
  providers: [BitcoinSyncWorkerProvider, BitcoinSyncWorkerRepository],
  exports: [BitcoinSyncWorkerService],
})
export class BitcoinSyncWorkerModule {}
