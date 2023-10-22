import { getGlobalPQueue } from '@meta-protocols-oracle/commons';
import PQueue from 'p-queue';

export const getHiroQueue = (): PQueue => {
  return getGlobalPQueue('bis-queue', {
    interval: 30e3,
    intervalCap: 8,
    concurrency: 8,
  });
};
