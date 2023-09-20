import { Logger } from '@nestjs/common';
import memoizee from 'memoizee';

export const getLogger = memoizee((name = 'saito') => {
  return new Logger(name, { timestamp: true });
});
