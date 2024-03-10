import { VaultModule } from '@meta-protocols-oracle/api';
import { PersistentModule } from '@meta-protocols-oracle/persistent';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../env';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import AuthServiceProvider from './auth.service';

export const kJWTExpiresIn = '20s';

@Module({
  imports: [
    PersistentModule,
    JwtModule.register({
      global: true,
      secret: env().JWT_SECRET,
      signOptions: { expiresIn: kJWTExpiresIn },
    }),
    VaultModule,
  ],
  providers: [AuthServiceProvider, AuthRepository],
  exports: [AuthServiceProvider],
  controllers: [AuthController],
})
export class AuthModule {}
