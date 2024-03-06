import { PersistentModule } from '@meta-protocols-oracle/persistent';
import { Module } from '@nestjs/common';
import { AuthClientRepository } from './auth-client.repository';
import AuthClientServiceProvider from './auth-client.service';

@Module({
  imports: [PersistentModule],
  providers: [AuthClientServiceProvider, AuthClientRepository],
  exports: [AuthClientServiceProvider],
})
export class AuthClientModule {}
