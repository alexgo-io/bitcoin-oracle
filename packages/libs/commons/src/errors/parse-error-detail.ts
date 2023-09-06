import { stringifyJSON } from '../utils/bitint-json';

export function parseErrorDetail(e: unknown): string {
  if (e instanceof Error) {
    return `message: ${e.message}\nstack: ${e.stack}`;
  } else {
    return stringifyJSON(e);
  }
}
