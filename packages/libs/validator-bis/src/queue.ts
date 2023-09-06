import { getGlobalPQueue } from '@alex-b20/commons';

export const getValidatorQueue = () => {
  return getGlobalPQueue('validator-queue', { concurrency: 5 });
};
