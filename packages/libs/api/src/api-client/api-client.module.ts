import { Module } from '@nestjs/common';
import { AuthClientModule } from '../auth-client';
import ApiClientServiceProvider from './api-client.service';

@Module({
  imports: [AuthClientModule],
  providers: [ApiClientServiceProvider],
  exports: [ApiClientServiceProvider],
})
export class ApiClientModule {}
