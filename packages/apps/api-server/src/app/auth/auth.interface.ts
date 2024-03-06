export abstract class AuthService {
  abstract signIn(
    role_name: string,
    secret_id_accessor: string,
  ): Promise<{ access_token: string }>;
}
