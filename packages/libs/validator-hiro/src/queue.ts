import { getGlobalPQueue } from '@bitcoin-oracle/commons';
import PQueue from 'p-queue';

export const getHiroQueue = (): PQueue => {
  return getGlobalPQueue('bis-queue', {});
};
export const getElectrumQueue = (): PQueue => {
  return getGlobalPQueue('electrum-queue', { concurrency: 20 });
};
