/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorDetails } from '@meta-protocols-oracle/commons';
import { StatusCode } from '@meta-protocols-oracle/types';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.interface';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>) {
    try {
      return await this.authService.signIn(
        signInDto.role_name,
        signInDto.secret_id_accessor,
      );
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw ErrorDetails.from(
          StatusCode.UNAUTHENTICATED,
          'Invalid credentials',
        ).throwHttpException();
      }

      throw e;
    }
  }
}
