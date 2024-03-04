import { Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.interface';

export class DefaultAuthService implements AuthService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async signIn(
    role_id: string,
    secret_id: string,
  ): Promise<{ access_token: string }> {
    if (role_id != 'r' || secret_id != 's') {
      throw new UnauthorizedException();
    }
    const payload = { iss: 'bitcoin_oracle', sub: role_id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}

const AuthServiceProvider = {
  provide: AuthService,
  useClass: DefaultAuthService,
};

export default AuthServiceProvider;
