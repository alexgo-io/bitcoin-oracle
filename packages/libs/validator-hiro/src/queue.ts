import { getGlobalPQueue } from '@bitcoin-oracle/commons';

export const getHiroQueue = () => {
  return getGlobalPQueue('bis-queue', {});
};
export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
