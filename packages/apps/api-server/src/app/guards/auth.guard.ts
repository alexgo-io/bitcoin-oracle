import { ServiceType, ServiceTypeSchema } from '@alex-b20/types';
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
  [ServiceTypeSchema.enum.RELAYER]: '0.0.1',
  [ServiceTypeSchema.enum.VALIDATOR]: '0.0.1',
} as const;

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    const serviceType = request.headers['x-service-type'] as ServiceType;
    const version = request.headers['x-version'];

    if (!authorization) {
      return false;
    }
    const token = authorization.split(' ')[1];
    if (!token) {
      return false;
    }
    // @AUDIT: ME-01
    const secretKey = getSecretKeys()[token];
    if (!secretKey) {
      return false;
    }

    if (!serviceType) {
      logger.warn(`Request received without service type.`);
      return false;
    }

    if (AUTH_VERSION_MAP[serviceType] !== version) {
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
