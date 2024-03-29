export abstract class AuthService {
  abstract signIn(
    role_name: string,
    secret_id_accessor: string,
  ): Promise<{ access_token: string }>;
}

export type ServiceJWTPayloadType = {
  iss: string;
  sub: string;
  'service-type'?: string;
  'validator-name'?: string;
  owner?: string;
};
