import memoizee from 'memoizee';
import PQueue from 'p-queue';

export type QueueConfig = ConstructorParameters<typeof PQueue>[0];
export const getGlobalPQueue = memoizee(
  (queueName: string, config?: QueueConfig | undefined) => {
    return new PQueue(config);
  },
  {
    normalizer: function (args) {
      return args[0];
    },
  },
);
