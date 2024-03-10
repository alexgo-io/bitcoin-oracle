export abstract class AuthClientService {
  abstract autoAuthAndRequestAccessToken(): Promise<string>;
}
