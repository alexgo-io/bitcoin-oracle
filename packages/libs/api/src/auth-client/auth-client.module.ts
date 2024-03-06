import { Module } from '@nestjs/common';
import AuthClientServiceProvider from './auth-client.service';

@Module({
  imports: [],
  providers: [AuthClientServiceProvider],
  exports: [AuthClientServiceProvider],
})
export class AuthClientModule {}
