import { Module } from '@nestjs/common';
import PersistentServiceProvider from './persistent.service';

@Module({
  imports: [],
  exports: [PersistentServiceProvider],
  providers: [PersistentServiceProvider],
})
export class PersistentModule {}
