import { env } from '@alex-b20/env';
import { StacksMainnet, StacksMocknet } from '@stacks/network';
import {
  ClarityValue,
  serializeCV,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import { createHash } from 'crypto';
import {
  StacksPrivateKey,
  createStacksPrivateKey,
  signWithKey,
} from 'micro-stacks/transactions';
import { indexer } from '../generated/contract_indexer';

export function getStacksNetwork() {
  if (env.STACKS_NETWORK_TYPE === 'testnet') {
    return new StacksMocknet({ url: env.STACKS_API_URL });
  } else if (env.STACKS_NETWORK_TYPE === 'mainnet') {
    return new StacksMainnet({ url: env.STACKS_API_URL });
  } else {
    throw new Error(`Unknown network type: ${env.STACKS_NETWORK_TYPE}`);
  }
}
function sha256(data: Buffer): Buffer {
  return createHash('sha256').update(data).digest();
}

export function structuredDataHash(structuredData: ClarityValue): Buffer {
  return sha256(serializeCV(structuredData) as Buffer);
}
export function getDomainHash() {
  return structuredDataHash(
    tupleCV({
      name: stringAsciiCV('ALEX BRC20 Indexer'),
      version: stringAsciiCV('0.0.1'),
      'chain-id': uintCV(getStacksNetwork().chainId),
    }),
  );
}
export const kStructuredDataPrefix = Buffer.from([
  0x53, 0x49, 0x50, 0x30, 0x31, 0x38,
]);

const encodeOrder = indexer['indexer']['hash-tx'].input[0].type.encode;
export const generateOrderHash = (order: Parameters<typeof encodeOrder>[0]) =>
  structuredDataHash(encodeOrder(order));

export async function signOrderHash(
  privateKey: StacksPrivateKey | string,
  orderHash: Buffer,
) {
  let key: StacksPrivateKey;
  if (typeof privateKey === 'string') {
    key = createStacksPrivateKey(privateKey);
  } else {
    key = privateKey;
  }

  const input = sha256(
    Buffer.concat([kStructuredDataPrefix, getDomainHash(), orderHash]),
  );

  const data = (await signWithKey(key, input.toString('hex'))).data;
  return Buffer.from(data.slice(2) + data.slice(0, 2), 'hex');
}

export async function signTx(
  privateKey: StacksPrivateKey | string,
  structuredData: ClarityValue,
) {
  const messageHash = structuredDataHash(structuredData);
  return signOrderHash(privateKey, messageHash);
}
