import { PersistentModule } from '@alex-b20/persistent';
import { Module } from '@nestjs/common';
import RelayerServiceProvider from './relayer.service';
import { RelayerRepository } from "./relayer.repository";

@Module({
  imports: [PersistentModule],
  providers: [RelayerServiceProvider, RelayerRepository],
})
export class RelayerModule {}
