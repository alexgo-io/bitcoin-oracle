import { Inject, UnauthorizedException } from '@nestjs/common';
import got from 'got-cjs';
import { decode } from 'jsonwebtoken';
import { join } from 'path';
import { env } from '../env';
import { VaultService } from '../vault';
import { AuthClientService } from './auth-client.interface';

export class DefaultAuthClientService implements AuthClientService {
  constructor(
    @Inject(VaultService) private readonly vaultService: VaultService,
  ) {}

  private login(params: { role_name: string; secret_id_accessor: string }) {
    return got
      .post(join(env().INDEXER_API_URL, '/api/v1/auth/login'), {
        json: params,
        responseType: 'json',
      })
      .json<{ access_token: string }>();
  }

  /**
   * Request an access token from the vault service by performing a login and then authenticating the role and secret IDs.
   *
   * @param {string} role_name - The name of the role.
   * @param {string} role_id - The ID of the role.
   * @param {string} secret_id - The ID of the secret.
   * @returns Returns a Promise which resolves to an object containing the access token.
   * @throws Will throw an exception if the login fails, role or secret IDs not found or role ID mismatch occurs.
   */
  private async requestAccessToken(
    role_name: string,
    role_id: string,
    secret_id: string,
  ) {
    // Authenticate with the vault service
    const loginResponse = await this.vaultService.appRole.login(
      role_id,
      secret_id,
    );
    if (loginResponse == null) {
      throw new UnauthorizedException('login failed');
    }
    this.vaultService.token = loginResponse.auth.client_token;

    // Check if the role name exists
    const role = await this.vaultService.appRole.read(role_name);
    if (role == null) {
      throw new UnauthorizedException(`role ${role_name} not found`);
    }

    // Verify the role ID for the given role name
    const roleIdResponse = await this.vaultService.appRole.readRoleID(
      role_name,
    );
    if (roleIdResponse == null) {
      throw new UnauthorizedException(`role_id not found for ${role_name}`);
    } else if (role_id !== roleIdResponse.data.role_id) {
      throw new Error(
        `role_id does not match, expected: ${roleIdResponse.data.role_id}, but got: ${role_id}`,
      );
    }

    // Verify the secret ID for the given role name
    const secret = await this.vaultService.appRole.readSecretID(
      role_name,
      secret_id,
    );
    if (secret == null) {
      throw new UnauthorizedException(`secret_id ${secret_id} not found`);
    }

    // Authenticate and retrieve the access token
    const secret_id_accessor = secret.data.secret_id_accessor;
    const response = await this.login({ role_name, secret_id_accessor });
    return {
      access_token: response.access_token,
    };
  }

  private getCacheDuration = (token: string) => {
    const decoded = decode(token) as { exp?: number };
    if (decoded?.exp) {
      const expInMilliseconds = decoded.exp * 1000;
      const duration = expInMilliseconds - Date.now() - 10 * 1000; // 10 seconds less than the exp time
      return duration > 0 ? duration : 0;
    }
    return 0; // Default case, should not occur
  };
  cache: { [key: string]: { token: string; timeoutId: NodeJS.Timeout } } = {};

  requestAccessTokenCached = async (
    role_name: string,
    role_id: string,
    secret_id: string,
  ): Promise<string> => {
    const key = `${role_name}:${role_id}:${secret_id}`;
    const cached = this.cache[key];

    // If the cache exists and hasn't expired
    if (cached) {
      return cached.token;
    }

    // Fetch a new token
    const newToken = (
      await this.requestAccessToken(role_name, role_id, secret_id)
    ).access_token;
    const cacheDuration = this.getCacheDuration(newToken);

    // Set up cache eviction
    const timeoutId = setTimeout(() => {
      delete this.cache[key];
    }, cacheDuration);

    // Store the new token and timeout in the cache
    this.cache[key] = { token: newToken, timeoutId };

    return newToken;
  };

  public async autoAuthAndRequestAccessToken() {
    const role_name = env().VAULT_ROLE_NAME;
    const role_id = env().VAULT_ROLE_ID;
    const secret_id = env().VAULT_SECRET_ID;
    return this.requestAccessTokenCached(role_name, role_id, secret_id);
  }
}

const AuthClientServiceProvider = {
  provide: AuthClientService,
  useClass: DefaultAuthClientService,
};

export default AuthClientServiceProvider;
