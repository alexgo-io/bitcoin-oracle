import { getGlobalPQueue } from '@alex-b20/commons';

export const getHiroQueue = () => {
  return getGlobalPQueue('bis-queue', {});
};
export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
