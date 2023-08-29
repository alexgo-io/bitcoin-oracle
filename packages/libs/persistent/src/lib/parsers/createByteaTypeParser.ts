import { TypeParser } from 'slonik';
import { hexToBuffer } from './utils';

const byteaParser = (value: string) => {
  return hexToBuffer(value);
};

export const createByteaTypeParser = (): TypeParser => {
  return {
    name: 'bytea',
    parse: byteaParser,
  };
};
