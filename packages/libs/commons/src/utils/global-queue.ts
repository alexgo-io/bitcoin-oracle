import memoizee from 'memoizee';
import PQueue from 'p-queue';

type QueueConfig = ConstructorParameters<typeof PQueue>[0];
export const getGlobalPQueue = memoizee(
  (queueName: string, config?: QueueConfig | undefined) => {
    return new PQueue(config);
  },
);
