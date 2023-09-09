import { getGlobalPQueue } from '@alex-b20/commons';

export const getHiroQueue = () => {
  return getGlobalPQueue('bis-queue', {
    // per 1 minute of 50 requests
    interval: 5e3,
    intervalCap: 4,
  });
};
export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
