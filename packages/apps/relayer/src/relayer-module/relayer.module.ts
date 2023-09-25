import { PersistentModule } from '@brc20-oracle/persistent';
import { Module } from '@nestjs/common';
import RelayerServiceProvider from './relayer.service';
import { RelayerRepository } from "./relayer.repository";
import { PinoLoggerModule } from "@brc20-oracle/commons";

@Module({
  imports: [PersistentModule, PinoLoggerModule],
  providers: [RelayerServiceProvider, RelayerRepository],
})
export class RelayerModule {}
