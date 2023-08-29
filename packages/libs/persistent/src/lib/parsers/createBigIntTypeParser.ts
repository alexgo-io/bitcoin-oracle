import { TypeParser } from 'slonik';

const bigintParser = (value: string) => {
  return BigInt(value);
};

// SELECT oid, typarray, typname FROM pg_type

export const createInt8TypeParser = (): TypeParser => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};

export const createFloat4TypeParser = (): TypeParser => {
  return {
    name: 'float4',
    parse: bigintParser,
  };
};

export const createFloat8TypeParser = (): TypeParser => {
  return {
    name: 'float8',
    parse: bigintParser,
  };
};

export const createIntegerTypeParser = (): TypeParser => {
  return {
    name: 'int4',
    parse: bigintParser,
  };
};
