import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { PersistentModule } from '@meta-protocols-oracle/persistent';
import { Module } from '@nestjs/common';
import { RelayerRepository } from './relayer.repository';
import RelayerServiceProvider from './relayer.service';

@Module({
  imports: [PersistentModule, PinoLoggerModule],
  providers: [RelayerServiceProvider, RelayerRepository],
})
export class RelayerModule {}
