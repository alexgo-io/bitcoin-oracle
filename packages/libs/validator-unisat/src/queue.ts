import { getGlobalPQueue } from '@meta-protocols-oracle/commons';
import PQueue from 'p-queue';
import { env } from './env';

export const getUnisatQueue = (): PQueue => {
  return getGlobalPQueue('unisat-queue', {
    concurrency: 20,
    interval: 5e3,
    intervalCap: Math.floor(env().RATE_LIMIT_PER_MINUTE / 5),
  });
};
