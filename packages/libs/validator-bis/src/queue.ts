import { getGlobalPQueue } from '@brc20-oracle/commons';

export const getBISQueue = () => {
  return getGlobalPQueue('bis-queue', {
    // per 1 minute of 50 requests
    interval: 5e3,
    intervalCap: 4,
  });
};
export const getElectrumQueue = () => {
  return getGlobalPQueue('electrum-queue', {
    concurrency: 10,
    interval: 10e3,
    intervalCap: 60,
  });
};
