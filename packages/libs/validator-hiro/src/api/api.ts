import memoizee from 'memoizee';
import { from } from 'rxjs';
import { getHiroQueue } from '../queue';
import { getActivityOnBlock, getBalanceOnBlock } from './api.raw';
import { HiroSchema } from './schema';

const getActivityOnBlockMemoized = memoizee(getActivityOnBlock, {
  promise: true,
  maxAge: 300e3,
});
export function getActivityOnBlock$(block: number, offset = 0, limit = 60) {
  return from(
    getHiroQueue().add(() =>
      getActivityOnBlockMemoized(block, offset, limit).then(
        HiroSchema.activity.parse,
      ),
    ),
  );
}

const getBalanceOnBlockMemoized = memoizee(getBalanceOnBlock, {
  promise: true,
  maxAge: 300e3,
});

export function getBalanceOnBlock$(address: string, block: number) {
  return from(
    getHiroQueue().add(() =>
      getBalanceOnBlockMemoized(address, block).then(HiroSchema.balance.parse),
    ),
  );
}
