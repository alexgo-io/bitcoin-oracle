import { Logger, LogLevel } from '@nestjs/common';
import { tap } from 'rxjs';
import { stringifyJSON } from '../utils/bitint-json';

export const debug = <T>(id?: string, showValue = true, stringify = true) =>
  loggerOperate<T>(id, showValue, stringify, 'debug');
export const log = <T>(id?: string, showValue = true, stringify = true) =>
  loggerOperate<T>(id, showValue, stringify, 'log');
export const warn = <T>(id?: string, showValue = true, stringify = true) =>
  loggerOperate<T>(id, showValue, stringify, 'warn');
export const error = <T>(id?: string, showValue = true, stringify = true) =>
  loggerOperate<T>(id, showValue, stringify, 'error');
export const verbose = <T>(id?: string, showValue = true, stringify = true) =>
  loggerOperate<T>(id, showValue, stringify, 'verbose');

export const loggerOperate = <T>(
  id?: string,
  showValue = true,
  stringify = true,
  level: LogLevel = 'debug',
) => {
  const padId = id?.padStart(8, ' ');
  const logger = new Logger(padId ?? 'debug', { timestamp: true });

  return tap<T>({
    next: value =>
      logger[level](
        `next: ${showValue ? (stringify ? stringifyJSON(value) : value) : ''}`,
      ),
    error: error => logger.error(`error: `, error),
    complete: () => logger.log(`completed`),
  });
};

export const isNotNull = <T>(t: T | null): t is T => t != null;
