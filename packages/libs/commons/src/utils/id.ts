import { createHash } from 'crypto';

export function computeValidatedTxsId(
  txHash: Buffer,
  orderHash: Buffer,
): Buffer {
  const txHashHexLower = txHash.toString('hex').toLowerCase();
  const orderHashHexLower = orderHash.toString('hex').toLowerCase();
  const combined = `${txHashHexLower}:${orderHashHexLower}`;
  return createHash('sha256').update(combined).digest();
}

export function computeTxsId(
  txHash: Buffer,
  output: string,
  satpoint: string,
): Buffer {
  const txHashHexLower = txHash.toString('hex').toLowerCase();
  const combined = `${txHashHexLower}:${output}:${satpoint}`;
  return createHash('sha256').update(combined).digest();
}
