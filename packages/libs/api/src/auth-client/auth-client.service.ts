import { Inject, UnauthorizedException } from '@nestjs/common';
import { ApiClient } from '../api-client';
import { env } from '../env';
import { VaultService } from '../vault';
import { AuthClientService } from './auth-client.interface';

export class DefaultAuthClientService implements AuthClientService {
  private readonly api = new ApiClient(env().INDEXER_API_URL);

  constructor(
    @Inject(VaultService) private readonly vaultService: VaultService,
  ) {}

  async requestAccessToken(
    role_name: string,
    role_id: string,
    secret_id: string,
  ) {
    const loginResponse = await this.vaultService.appRole.login(
      role_id,
      secret_id,
    );
    if (loginResponse == null) {
      throw new UnauthorizedException('login failed');
    }

    this.vaultService.token = loginResponse.auth.client_token;

    const role = await this.vaultService.appRole.read(role_name);
    if (role == null) {
      throw new UnauthorizedException(`role ${role_name} not found`);
    }
    const roleIdResponse = await this.vaultService.appRole.readRoleID(
      role_name,
    );
    if (roleIdResponse == null) {
      throw new UnauthorizedException(`role_id not found for ${role_name}`);
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
      throw new UnauthorizedException(`secret_id ${secret_id} not found`);
    }

    const secret_id_accessor = secret.data.secret_id_accessor;

    const response = await this.api
      .auth()
      .signIn({ role_name, secret_id_accessor });
    return {
      access_token: response.access_token,
    };
  }
}

const AuthClientServiceProvider = {
  provide: AuthClientService,
  useClass: DefaultAuthClientService,
};

export default AuthClientServiceProvider;
