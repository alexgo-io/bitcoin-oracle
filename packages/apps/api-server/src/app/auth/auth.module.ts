import { PersistentModule } from '@meta-protocols-oracle/persistent';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import AuthServiceProvider from './auth.service';

@Module({
  imports: [
    PersistentModule,
    JwtModule.register({
      global: true,
      secret: 'secretKey',
      signOptions: { expiresIn: '10s' },
    }),
  ],
  providers: [AuthServiceProvider, AuthRepository],
  exports: [AuthServiceProvider],
  controllers: [AuthController],
})
export class AuthModule {}
