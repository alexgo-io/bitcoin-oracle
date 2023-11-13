import crypto from 'crypto';
import { env } from './env';

function shardIndex(key: string): bigint {
  const SHARD_RELAYER_INDEX = env().SHARD_RELAYER_INDEX;
  const SHARD_TOTAL_RELAYERS = env().SHARD_TOTAL_RELAYERS;
  if (SHARD_RELAYER_INDEX >= SHARD_TOTAL_RELAYERS) {
    throw new Error(
      `SHARD_RELAYER_INDEX ${SHARD_RELAYER_INDEX} >= SHARD_TOTAL_RELAYERS ${SHARD_TOTAL_RELAYERS}`,
    );
  }
  return (
    BigInt(
      '0x' +
        crypto
          .createHash('sha256')
          .update(key)
          .digest()
          .toString('hex')
          .substring(0, 20),
    ) % SHARD_TOTAL_RELAYERS
  );
}
export function shouldHandleForKey(key: string): boolean {
  return shardIndex(key) === BigInt(env().SHARD_RELAYER_INDEX);
}
