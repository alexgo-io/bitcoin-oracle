import { getGlobalPQueue } from '@meta-protocols-oracle/commons';

export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
