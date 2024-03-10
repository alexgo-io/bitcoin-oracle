import { Enums } from '@meta-protocols-oracle/types';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { env } from '../../env';
import { ServiceJWTPayloadType } from '../auth';

const AUTH_VERSION_MAP = {
  [Enums.ServiceType.enum.relayer]: '0.0.1',
  [Enums.ServiceType.enum.validator]: '0.0.1',
  [Enums.ServiceType.enum.indexer]: '0.0.1',
} as const;

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    if (env().DISABLE_AUTH) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload: ServiceJWTPayloadType = await this.jwtService.verifyAsync(
        token,
        {
          secret: env().JWT_SECRET,
        },
      );

      const serviceType = Enums.ServiceType.safeParse(payload['service-type']);
      if (!serviceType.success) {
        throw new UnauthorizedException(
          `Invalid service type: ${payload['service-type']}`,
        );
      }

      const version = request.headers['x-version'];
      if (AUTH_VERSION_MAP[serviceType.data] !== version) {
        this.logger.warn(
          `Request received from outdated version : ${version}, ${serviceType}.`,
        );
        return false;
      }

      request['user'] = payload;
    } catch (e) {
      this.logger.error(`Error while verifying jwt: ${e}`);
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
