import { Logger } from '@nestjs/common';
import memoizee from 'memoizee';

export const getLogger = memoizee(
  (name = 'bitcoin-oracle') => {
    return new Logger(name, { timestamp: true });
  },
  { length: false },
);
