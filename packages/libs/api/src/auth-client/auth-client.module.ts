import { Module } from '@nestjs/common';
import { VaultModule } from '../vault';
import AuthClientServiceProvider from './auth-client.service';

@Module({
  imports: [VaultModule],
  providers: [AuthClientServiceProvider],
  exports: [AuthClientServiceProvider],
})
export class AuthClientModule {}
