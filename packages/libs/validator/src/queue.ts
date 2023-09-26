import { getGlobalPQueue } from '@bitcoin-oracle/commons';

export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
