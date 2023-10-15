import { getGlobalPQueue } from '@meta-protocols-oracle/commons';
import PQueue from 'p-queue';

export const getBISQueue = (): PQueue => {
  return getGlobalPQueue('bis-queue', {
    // per 1 minute of 50 requests
    interval: 5e3,
    intervalCap: 4,
  });
};
export const getElectrumQueue = (): PQueue => {
  return getGlobalPQueue('electrum-queue', {
    concurrency: 10,
    interval: 10e3,
    intervalCap: 60,
  });
};
