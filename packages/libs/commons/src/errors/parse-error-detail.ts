import { HTTPError } from 'got-cjs';
import { stringifyJSON } from '../utils/bitint-json';

export function parseErrorDetail(e: unknown): string {
  if (e instanceof HTTPError) {
    return `http-error[${e.response.statusCode}]: ${e.message}
url: ${e.response.url}
code: ${e.code}
request: ${stringifyJSON(e.request.options.toJSON())}
response: ${stringifyJSON(e.response.body)}
response-headers: ${stringifyJSON(e.response.rawHeaders)}
stack: ${e.stack}
`;
  }

  if (e instanceof Error) {
    return `error: ${e.message}
stack: ${e.stack}`;
  }

  return `non-error thrown, object:
${stringifyJSON(e)}
  `;
}
