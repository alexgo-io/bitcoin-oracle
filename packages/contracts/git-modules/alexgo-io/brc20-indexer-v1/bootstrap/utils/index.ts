import { CoreNodeInfoResponse } from '@stacks/stacks-blockchain-api-types';
import { STACKS_API_URL } from '../constants';

export function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x);
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function getCurrentInfo(): Promise<CoreNodeInfoResponse> {
  return fetch(`${STACKS_API_URL()}/v2/info`).then(res => res.json());
}

export function isNotNull<T>(input: T | undefined | null): input is T {
  return input != null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function repeatForever(fn: () => Promise<void>, interval: number) {
  // noinspection InfiniteLoopJS
  while (true) {
    await fn().catch(e => console.error(e));
    await sleep(interval);
  }
}
export function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
