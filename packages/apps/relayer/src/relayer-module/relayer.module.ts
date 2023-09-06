import { PersistentModule } from '@alex-b20/persistent';
import { Module } from '@nestjs/common';
import RelayerServiceProvider from './relayer.service';
import { RelayerRepository } from "./relayer.repository";
import { PinoLoggerModule } from "@alex-b20/commons";

@Module({
  imports: [PersistentModule, PinoLoggerModule],
  providers: [RelayerServiceProvider, RelayerRepository],
})
export class RelayerModule {}
