import { Inject, UnauthorizedException } from '@nestjs/common';
import { VaultService } from '../vault';
import { AuthClientService } from './auth-client.interface';

export class DefaultAuthClientService implements AuthClientService {
  constructor(
    @Inject(VaultService) private readonly vaultService: VaultService,
  ) {}

  async requestAccessToken(
    role_name: string,
    role_id: string,
    secret_id: string,
  ) {
    const role = await this.vaultService.appRole.read(role_name);
    if (role == null) {
      throw new UnauthorizedException();
    }
    const roleIdResponse = await this.vaultService.appRole.readRoleID(
      role_name,
    );
    if (roleIdResponse == null) {
      throw new UnauthorizedException();
    }
    if (role_id !== roleIdResponse.data.role_id) {
      throw new Error(
        `role_id does not match, expected: ${roleIdResponse.data.role_id}, but got: ${role_id}`,
      );
    }
    const secret = await this.vaultService.appRole.readSecretID(
      role_name,
      secret_id,
    );
    if (secret == null) {
      throw new UnauthorizedException();
    }
  }
}

const AuthClientServiceProvider = {
  provide: AuthClientService,
  useClass: DefaultAuthClientService,
};

export default AuthClientServiceProvider;
