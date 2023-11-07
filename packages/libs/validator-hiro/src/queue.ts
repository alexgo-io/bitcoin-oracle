import { getGlobalPQueue } from '@meta-protocols-oracle/commons';
import PQueue from 'p-queue';

export const getHiroQueue = (): PQueue => {
  return getGlobalPQueue('bis-queue', {
    concurrency: 20,
    interval: 10e3,
    intervalCap: 4,
  });
};
