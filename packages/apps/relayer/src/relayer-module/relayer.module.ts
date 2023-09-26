import { PersistentModule } from '@bitcoin-oracle/persistent';
import { Module } from '@nestjs/common';
import RelayerServiceProvider from './relayer.service';
import { RelayerRepository } from "./relayer.repository";
import { PinoLoggerModule } from "@bitcoin-oracle/commons";

@Module({
  imports: [PersistentModule, PinoLoggerModule],
  providers: [RelayerServiceProvider, RelayerRepository],
})
export class RelayerModule {}
