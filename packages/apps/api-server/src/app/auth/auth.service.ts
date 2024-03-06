import { kMetadataNames, VaultService } from '@bitcoin-oracle/api';
import { trimObj } from '@meta-protocols-oracle/commons';
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
      throw new UnauthorizedException(`role ${role_name} not found`);
    }

    const secret = await this.vaultService.appRole.readSecretIDAccessor(
      role_name,
      secret_id_accessor,
    );
    if (secret == null) {
      throw new UnauthorizedException(
        `secret_id_accessor ${secret_id_accessor} not found`,
      );
    }

    const metadata = secret.data.metadata;

    const payload = trimObj({
      iss: 'bitcoin_oracle',
      sub: role_name,
      [kMetadataNames.enum['service-type']]:
        metadata[kMetadataNames.enum['service-type']],
      [kMetadataNames.enum['validator-name']]:
        metadata[kMetadataNames.enum['validator-name']],
      [kMetadataNames.enum['owner']]: metadata[kMetadataNames.enum['owner']],
    });
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
