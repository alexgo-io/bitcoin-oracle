import { getGlobalPQueue } from '@meta-protocols-oracle/commons';
import PQueue from 'p-queue';

export const getElectrumQueue: () => PQueue = () => {
  return getGlobalPQueue('electrum-queue', {
    concurrency: 20,
    timeout: 60e3,
    throwOnTimeout: true,
  });
};
