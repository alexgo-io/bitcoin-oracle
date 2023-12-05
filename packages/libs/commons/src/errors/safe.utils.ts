/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseErrorDetail } from '../errors';
import { makeError, makeSuccess, Result } from '../utils';

/*
  make any async function safe by wrapping it in a try/catch block
  the error message is parsed via parseErrorDetail which is the central
  error handling function for all saito user facing packages
 */
export function makeSafeAsyncFunction<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  options: { tapError?: (error: unknown, args: A) => void } = {},
): (...args: A) => Promise<Result<T>> {
  return async (...args: A): Promise<Result<T>> => {
    try {
      const data = await fn(...args);
      return makeSuccess(data);
    } catch (error) {
      if (options.tapError) {
        options.tapError(error, args);
      }
      return makeError(parseErrorDetail(error));
    }
  };
}
