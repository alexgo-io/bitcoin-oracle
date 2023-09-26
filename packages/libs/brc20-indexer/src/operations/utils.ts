export function assertNever(x: never) {
  throw new Error('Unexpected object: ' + x);
}

export async function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
