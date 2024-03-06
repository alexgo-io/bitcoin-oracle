import { VaultService } from '@bitcoin-oracle/api';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.interface';

export class DefaultAuthService implements AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(VaultService) private readonly vaultService: VaultService,
  ) {}

  async signIn(
    role_name: string,
    secret_id_accessor: string,
  ): Promise<{ access_token: string }> {
    const role = await this.vaultService.appRole.read(role_name);
    if (role == null) {
      throw new UnauthorizedException();
    }

    const secret = await this.vaultService.appRole.readSecretIDAccessor(
      role_name,
      secret_id_accessor,
    );
    console.log(secret);

    if (role_name != 'r' || secret_id_accessor != 's') {
      throw new UnauthorizedException();
    }
    const payload = { iss: 'bitcoin_oracle', sub: role_name };
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
