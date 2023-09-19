import { TypeParser } from 'slonik';

const numericParser = (value: string) => {
  return BigInt(value);
};

export const createNumericTypeParser = (): TypeParser => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
