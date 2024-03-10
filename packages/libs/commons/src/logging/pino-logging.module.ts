import { LoggerModule } from 'nestjs-pino';
import pretty from 'pino-pretty';
import { env } from '../env';

export const PinoLoggerModule = LoggerModule.forRoot({
  pinoHttp: {
    level: env().LOG_LEVEL,
    autoLogging: false,
    stream:
      env().NODE_ENV === 'production'
        ? undefined
        : pretty({ hideObject: false }),
  },
});
