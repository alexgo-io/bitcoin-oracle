import { getGlobalPQueue } from '@alex-b20/commons';

export const getBISQueue = () => {
  return getGlobalPQueue('bis-queue', {
    concurrency: 5,
    // per 1 minute of 50 requests
    interval: 5e3,
    intervalCap: 3,
  });
};
export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
