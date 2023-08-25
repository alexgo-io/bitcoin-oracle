import { ClarityType, uintCV } from '@stacks/transactions';
import { transcoders } from 'clarity-codegen';
import type { Decoder, Encoder } from 'clarity-codegen/lib/runtime/types';

export * from 'clarity-codegen';

export const numberCV: Encoder<bigint> = input => uintCV(input.toString(10));

export const intResult: Decoder<bigint> = result => {
  if (result.type === ClarityType.Int || result.type === ClarityType.UInt) {
    return BigInt(result.value.toString(10));
  }
  throw new Error(`Expected integer, got ${result.type}`);
};

export const numberT = transcoders({
  encode: numberCV,
  decode: intResult,
});
