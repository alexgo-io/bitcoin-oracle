import { getGlobalPQueue } from '@alex-b20/commons';

export const getBISQueue = () => {
  return getGlobalPQueue('bis-queue', { concurrency: 5 });
};
export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
