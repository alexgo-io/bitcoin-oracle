export abstract class AuthService {
  abstract signIn(
    role_id: string,
    secret_id: string,
  ): Promise<{ access_token: string }>;
}
