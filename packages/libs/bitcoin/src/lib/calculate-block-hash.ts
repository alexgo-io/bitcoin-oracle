import * as crypto from 'crypto';
function reverse(src: Buffer) {
  const buffer = Buffer.alloc(src.length);

  for (let i = 0, j = src.length - 1; i <= j; ++i, --j) {
    buffer[i] = src[j];
    buffer[j] = src[i];
  }

  return buffer;
}

export function calculateBlockHash(blockHeader: Buffer): Buffer {
  const headerBuf = blockHeader;
  const hash1 = crypto.createHash('sha256');
  const hash2 = crypto.createHash('sha256');
  hash1.update(headerBuf);
  const step1 = hash1.digest();
  hash2.update(step1);
  const step2 = hash2.digest();
  const reversedHash = reverse(step2);
  return reversedHash;
}
