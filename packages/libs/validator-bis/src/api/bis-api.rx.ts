import { getLogger } from '@meta-protocols-oracle/commons';
import memoizee from 'memoizee';
import { from } from 'rxjs';
import { getBISQueue } from '../queue';
import { getActivityOnBlock, getBalanceOnBlock, getTokenInfo } from './bis-api';

const getActivityOnBlockMemoized = memoizee(getActivityOnBlock, {
  promise: true,
  maxAge: 300e3,
});
export function getActivityOnBlock$(block: number) {
  return from(
    getBISQueue().add(() =>
      getActivityOnBlockMemoized(block).then(r => {
        getLogger('bis-queue').debug(
          `queue size: ${getBISQueue().size}. getActivityOnBlock`,
        );
        return r;
      }),
    ),
  );
}

const getBalanceOnBlockMemoized = memoizee(getBalanceOnBlock, {
  promise: true,
  maxAge: 300e3,
});

export function getBalanceOnBlock$(address: string, block: number) {
  return from(
    getBISQueue().add(() =>
      getBalanceOnBlockMemoized(address, block).then(r => {
        getLogger('bis-queue').debug(
          `queue size: ${getBISQueue().size}. getBalanceOnBlock`,
        );
        return r;
      }),
    ),
  );
}

const getTokenInfoMemoized = memoizee(getTokenInfo, {
  promise: true,
});

export function getTokenInfo$(token: string) {
  return from(
    getBISQueue().add(() =>
      getTokenInfoMemoized(token).then(r => {
        getLogger('bis-queue').debug(
          `queue size: ${getBISQueue().size}. getTokenInfo`,
        );
        return r;
      }),
    ),
  );
}
