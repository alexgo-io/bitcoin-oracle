import { createHash } from 'crypto';

export function isStacksAddressEqual(
  address1: string,
  address2: string,
): boolean {
  return address1.toLowerCase() === address2.toLowerCase();
}

export function uint8ArrayToBuffer(u: Uint8Array): Buffer {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return toBuffer(String.fromCharCode.apply(null, u));
}

export function uint8ArrayToHex(u: Uint8Array): string {
  return uint8ArrayToBuffer(u).toString('hex');
}

export function toBuffer(input: string) {
  if (input.startsWith('ST') || input.startsWith('SP')) {
    // for stacks address, we encoding it with uft8 buffer
    return Buffer.from(input);
  }

  return Buffer.from(
    input.length >= 2 && input[1] === 'x' ? input.slice(2) : input,
    'hex',
  );
}

export function sha256(data: Uint8Array): Buffer {
  return createHash('sha256').update(data).digest();
}

export function assertNever(x: never) {
  throw new Error('Unexpected object: ' + x);
}
