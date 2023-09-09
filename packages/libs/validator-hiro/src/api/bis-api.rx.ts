import memoizee from 'memoizee';
import { from } from 'rxjs';
import { getHiroQueue } from '../queue';
import { getActivityOnBlock, getBalanceOnBlock } from './bis-api';

const getActivityOnBlockMemoized = memoizee(getActivityOnBlock, {
  promise: true,
  maxAge: 300e3,
});
export function getActivityOnBlock$(block: number) {
  return from(getHiroQueue().add(() => getActivityOnBlockMemoized(block)));
}

const getBalanceOnBlockMemoized = memoizee(getBalanceOnBlock, {
  promise: true,
  maxAge: 300e3,
});

export function getBalanceOnBlock$(address: string, block: number) {
  return from(
    getHiroQueue().add(() => getBalanceOnBlockMemoized(address, block)),
  );
}
