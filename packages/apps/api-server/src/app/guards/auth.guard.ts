import { Enums } from '@alex-b20/types';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import memoizee from 'memoizee';
import { Observable } from 'rxjs';
import { env } from '../../env';

const getSecretKeys: () => { [key: string]: string } = memoizee(() => {
  return JSON.parse(env.ALEX_B20_API_CREDENTIALS);
});

const logger = new Logger('api-server', { timestamp: true });

const AUTH_VERSION_MAP = {
  [Enums.ServiceType.enum.RELAYER]: '0.0.1',
  [Enums.ServiceType.enum.VALIDATOR]: '0.0.1',
} as const;

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    const serviceType = Enums.ServiceType.safeParse(
      request.headers['x-service-type'],
    );
    if (!serviceType.success) {
      logger.warn(`Request received without service type.`);
      return false;
    }
    const version = request.headers['x-version'];

    if (!authorization) {
      return false;
    }
    const token = authorization.split(' ')[1];
    if (!token) {
      return false;
    }

    const secretKey = getSecretKeys()[token];
    if (!secretKey) {
      return false;
    }

    if (AUTH_VERSION_MAP[serviceType.data] !== version) {
      logger.warn(
        `Request received from outdated version : ${version}, ${serviceType}.`,
      );
      return false;
    }

    request.user = {
      name: secretKey,
    };

    return true;
  }
}
