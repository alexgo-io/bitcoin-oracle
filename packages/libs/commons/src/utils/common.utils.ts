import { Observable } from 'rxjs';

export class Nothing {
  // This lets us do `Exclude<T, Nothing>`
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private _!: unique symbol;
}
export type ValidRecipeReturnType<State> =
  | State
  | void
  | undefined
  | (State extends undefined ? Nothing : never);

export function filterNotEmpty<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  return value !== null && value !== undefined;
}

export function toPrefix0xString(tx: string) {
  if (tx.startsWith('0x')) {
    return tx;
  }
  return `0x${tx}`;
}

export async function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export type Unobservable<T> = T extends Observable<infer R> ? R : T;

export function trimObj<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        result[key] = trimObj(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}
