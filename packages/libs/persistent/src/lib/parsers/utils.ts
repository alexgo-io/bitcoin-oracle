/**
 * Encodes a buffer as a `0x` prefixed lower-case hex string.
 * Returns an empty string if the buffer is zero length.
 */
export function bufferToHexPrefixString(buff: Buffer): string {
  if (buff.length === 0) {
    return '';
  }
  return '\\x' + buff.toString('hex');
}

export function hexToBuffer(hex: string): Buffer {
  if (hex.length === 0) {
    return Buffer.alloc(0);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(`Hex string is an odd number of digits: ${hex}`);
  }

  if (hex.startsWith('\\x')) {
    return Buffer.from(hex.substring(2), 'hex');
  }

  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    return Buffer.from(hex.substring(2), 'hex');
  }

  throw new Error(`Hex string is missing the "\\x" prefix: "${hex}"`);
}
