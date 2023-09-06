import PQueue from 'p-queue';
import { memoizeWith } from 'ramda';

type QueueConfig = ConstructorParameters<typeof PQueue>[0];
export const getGlobalPQueue = memoizeWith(
  (v: string) => {
    return v;
  },
  (queueName: string, config?: QueueConfig | undefined) => {
    return new PQueue(config);
  },
);
