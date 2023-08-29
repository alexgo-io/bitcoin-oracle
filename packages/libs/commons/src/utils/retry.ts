import { Logger } from '@nestjs/common';
import pRetry from 'p-retry';
import { stringifyJSON } from './bitint-json';

export function dbRetry<T>(
  input: (attemptCount: number) => PromiseLike<T> | T,
  options: { logger: Logger },
): Promise<T> {
  return pRetry(input, {
    retries: 10,
    minTimeout: 250,
    maxTimeout: 250,
    onFailedAttempt: error => {
      options.logger.warn(
        `retrying: ${error.attemptNumber}/${
          error.retriesLeft + error.attemptNumber
        } - ${error}`,
      );
    },
  });
}

const logger = new Logger('retry');
export const wrapRetry = <T>(
  fn: () => Promise<T>,
  label = 'retry',
): Promise<T> => {
  return pRetry(
    () => {
      return fn().catch(e => {
        if (e instanceof Error) {
          throw e;
        } else {
          const wrapError = new Error(
            `[${label}] wrapped error: ${stringifyJSON(e)}`,
          );
          logger.error(
            `[${label}] is not error, wrapping error: ${stringifyJSON(e)}`,
          );
          throw wrapError;
        }
      });
    },
    {
      retries: 10,
      factor: 1,
      minTimeout: 200,
      maxTimeout: 500,
      onFailedAttempt: error => {
        logger.warn(
          `[${label}] Attempt ${error.attemptNumber} failed. There are ${
            error.retriesLeft
          } retries left., error: ${error.stack ?? error}}`,
        );
      },
    },
  );
};
