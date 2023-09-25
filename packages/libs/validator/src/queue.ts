import { getGlobalPQueue } from '@brc20-oracle/commons';

export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
