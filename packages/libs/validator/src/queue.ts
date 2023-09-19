import { getGlobalPQueue } from '@alex-b20/commons';

export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
