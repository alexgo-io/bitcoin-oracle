import { Module } from '@nestjs/common';
import ApiClientServiceProvider from './api-client.service';

@Module({
  imports: [],
  providers: [ApiClientServiceProvider],
  exports: [ApiClientServiceProvider],
})
export class ApiClientModule {}
