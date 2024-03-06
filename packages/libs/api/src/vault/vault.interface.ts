import { z } from 'zod';

export const kMetadataNames = z.enum([
  'service-type',
  'validator-name',
  'owner',
]);

export abstract class VaultService {
  public token?: string;
  abstract get appRole(): {
    read: (role_name: string) => Promise<ReadResponse>;
    readRoleID: (role_name: string) => Promise<ReadRoleIDResponse>;
    readSecretID: (
      role_name: string,
      secret_id: string,
    ) => Promise<ReadSecretIDResponse>;
    login: (
      role_id: string,
      secret_id: string,
    ) => Promise<{
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
    }>;
    generateSecretID: (
      role_name: string,
      options: {
        metadata?: string;
        cidr_list?: string[];
        token_bound_cidrs?: string[];
        num_uses?: number;
        ttl?: string;
      },
    ) => Promise<unknown>;
    readSecretIDAccessor: (
      role_name: string,
      secret_id_accessor: string,
    ) => Promise<ReadSecretIDAccessorResponse>;
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
    ) => Promise<unknown>;
  };
}

export interface ReadResponse {
  data: {
    token_ttl: number;
    token_max_ttl: number;
    secret_id_ttl: number;
    secret_id_num_uses: number;
    token_policies: string[];
    period: number;
    bind_secret_id: boolean;
    secret_id_bound_cidrs: string[];
  };
  lease_duration: number;
  renewable: boolean;
  lease_id: string;
}

export interface ReadRoleIDResponse {
  data: {
    role_id: string;
  };
}

export interface ReadSecretIDResponse {
  data: {
    cidr_list: string[];
    creation_time: string;
    expiration_time: string;
    last_updated_time: string;
    metadata: Record<string, string>;
    secret_id_accessor: string;
    secret_id_num_uses: number;
    secret_id_ttl: number;
    token_bound_cidrs: string[];
  };
}

export interface ReadSecretIDAccessorResponse {
  data: {
    cidr_list: string[];
    creation_time: string;
    expiration_time: string;
    last_updated_time: string;
    metadata: Record<string, string>;
    secret_id_accessor: string;
    secret_id_num_uses: number;
    secret_id_ttl: number;
    token_bound_cidrs: string[];
  };
}
