export function fromUint8Array(arr: Uint8Array): Buffer {
  return Buffer.from(arr, arr.byteOffset, arr.byteLength);
}
