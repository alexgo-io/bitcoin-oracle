import { fastRetry, parseErrorDetail } from '@meta-protocols-oracle/commons';
import { Logger } from '@nestjs/common';
import got from 'got-cjs';
import { join } from 'path';
import {
  ReadResponse,
  ReadRoleIDResponse,
  ReadSecretIDAccessorResponse,
  ReadSecretIDResponse,
  VaultService,
} from './vault.interface';

export class DefaultVaultService implements VaultService {
  private readonly logger = new Logger(VaultService.name);

  constructor(private readonly host: string, private readonly token: string) {}

  private get base() {
    return join(this.host, 'v1');
  }

  private got<T>(params: {
    method: 'get' | 'post';
    path: string;
    notation: string;
    body?: object;
  }) {
    const { method, path, notation } = params;
    try {
      const options = {
        headers: {
          'X-Vault-Token': this.token,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      if (method !== 'get') {
        if (params.body != null) {
          options.body = JSON.stringify(params.body);
        }
      }
      return fastRetry(() =>
        got[method](join(this.base, path), options).json<T>(),
      );
    } catch (e) {
      this.logger.error(`[${notation}] ${parseErrorDetail(e)}`);
      throw e;
    }
  }

  get appRole() {
    return {
      // GET	/auth/approle/role/:role_name
      read: (role_name: string) => {
        return this.got<ReadResponse>({
          method: 'get',
          path: `auth/approle/role/${role_name}`,
          notation: `appRole.read(${role_name})`,
        });
      },
      // GET	/auth/approle/role/:role_name/role-id
      readRoleID: (role_name: string) => {
        return this.got<ReadRoleIDResponse>({
          method: 'get',
          path: `auth/approle/role/${role_name}/role-id`,
          notation: `appRole.readRoleID(${role_name})`,
        });
      },

      // POST /auth/approle/role/:role_name/secret-id/lookup
      readSecretID: (role_name: string, secret_id: string) => {
        return this.got<ReadSecretIDResponse>({
          method: 'post',
          path: `auth/approle/role/${role_name}/secret-id/lookup`,
          notation: `appRole.readSecretID(${role_name})`,
          body: { secret_id },
        });
      },
      /*
      POST	/auth/approle/login
      Parameters
        role_id (string: <required>) - RoleID of the AppRole.
        secret_id (string: <required>) - SecretID belonging to AppRole.
       */
      login: (role_id: string, secret_id: string) => {
        return this.got<{
          auth: {
            renewable: boolean;
            lease_duration: number;
            metadata: string[];
            token_policies: string[];
            accessor: string;
            client_token: string;
          };
          lease_duration: number;
          renewable: boolean;
          lease_id: string;
        }>({
          method: 'post',
          path: 'auth/approle/login',
          notation: `appRole.login(${role_id})`,
          body: { role_id, secret_id },
        });
      },

      // POST /auth/approle/role/:role_name/secret-id
      generateSecretID: (
        role_name: string,
        options: {
          metadata?: string;
          cidr_list?: string[];
          token_bound_cidrs?: string[];
          num_uses?: number;
          ttl?: string;
        },
      ) => {
        return this.got({
          method: 'post',
          path: `auth/approle/role/${role_name}/secret-id`,
          notation: `appRole.generateSecretID(${role_name})`,
          body: options,
        });
      },

      // POST /auth/approle/role/:role_name/secret-id-accessor/lookup
      readSecretIDAccessor: (role_name: string, secret_id_accessor: string) => {
        return this.got<ReadSecretIDAccessorResponse>({
          method: 'post',
          path: `auth/approle/role/${role_name}/secret-id-accessor/lookup`,
          notation: `appRole.readSecretIDAccessor(${role_name})`,
          body: { secret_id_accessor },
        });
      },

      createOrUpdateAppRole: (
        role_name: string,
        options: {
          bind_secret_id?: boolean;
          secret_id_bound_cidrs?: string[];
          secret_id_num_uses?: number;
          secret_id_ttl?: string;
          local_secret_ids?: boolean;
          token_ttl?: string | number;
          token_max_ttl?: string | number;
          token_policies?: string[] | string;
          policies?: string[] | string;
          token_bound_cidrs?: string[] | string;
          token_explicit_max_ttl?: string | number;
          token_no_default_policy?: boolean;
          token_num_uses?: number;
          token_period?: string | number;
          token_type?: string;
        },
      ) => {
        if (!role_name || role_name.length === 0 || role_name.length > 4096) {
          throw new Error(
            'Invalid role_name: must be non-empty and less than 4096 bytes',
          );
        }
        if (!/[a-zA-Z0-9 _.-]+/.test(role_name)) {
          throw new Error(
            'Invalid role_name: accepted characters include a-Z, 0-9, space, hyphen, underscore, and periods.',
          );
        }
        if (Object.keys(options).length === 0 || !options.bind_secret_id) {
          throw new Error(
            'At least one option must be enabled and bind_secret_id is required.',
          );
        }
        return this.got({
          method: 'post',
          path: `auth/approle/role/${role_name}`,
          notation: `appRole.createOrUpdateAppRole(${role_name})`,
          body: options,
        });
      },
    };
  }
}

const VaultServiceProvider = {
  provide: VaultService,
  useClass: DefaultVaultService,
};

export default VaultServiceProvider;

async function main() {
  const svc = new DefaultVaultService(
    'http://localhost:8200',
    'E9oRo-9hr8V-ZSaIS',
  );
  // const a = await svc.appRole.read('bitcoin-oracle-api-role'); //?
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // const roleId = (await svc.appRole.readRoleID('bitcoin-oracle-api-role')).data
  //   .role_id; //?
  // const c = await svc.appRole.login(
  //   roleId,
  //   '65577f7a-746c-3cbd-5eb6-a5afecf2b341',
  // ); //?

  const idac = await svc.appRole.readSecretIDAccessor(
    'bitcoin-oracle-indexer-bis-alex-role',
    'bb13bb84-a34c-c89d-8066-17cdef9e98ca',
  );
  idac; //?
}

main().catch(console.error);
