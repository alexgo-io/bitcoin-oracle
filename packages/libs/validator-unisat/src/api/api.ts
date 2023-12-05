import { getLogger } from '@meta-protocols-oracle/commons';
import memoizee from 'memoizee';
import { EMPTY, expand, from, reduce } from 'rxjs';
import { getUnisatQueue } from '../queue';
import {
  getActivityOnBlock,
  getBalanceOnBlock,
  kUnisatPageLimit,
} from './api.raw';
import { UnisatAPISchema, UnisatType } from './schema';

export function getActivityOnBlock$(
  block: number,
  offset = 0,
  limit = kUnisatPageLimit,
) {
  return from(
    getUnisatQueue().add(() =>
      getActivityOnBlock(block, offset, limit).then(activity => {
        const result = UnisatAPISchema.activity.safeParse(activity);
        if (result.success) {
          return result.data.data.data;
        }

        getLogger('unisat-api-parsing').error(
          `Failed to parse activity on block ${block} at offset ${offset} with limit ${limit}, error: ${result.error}`,
        );

        throw new Error(
          result.error.issues.map(issue => issue.message).join('\n'),
        );
      }),
    ),
  );
}

export function getAllActivitiesOnBlock$(
  block: number,
  pageLimit = kUnisatPageLimit,
  totalLimit = Number.MAX_SAFE_INTEGER,
) {
  let offset = 0;
  return getActivityOnBlock$(block, 0, pageLimit).pipe(
    expand(value => {
      if (value.detail.length === 0) {
        return EMPTY;
      }
      if (value?.total == null) {
        return EMPTY;
      }
      if (offset + pageLimit >= value.total) {
        return EMPTY;
      }
      if (offset + pageLimit >= totalLimit) {
        return EMPTY;
      }
      offset += pageLimit;
      return getActivityOnBlock$(block, offset, pageLimit);
    }),
    reduce(
      (acc, current) => acc.concat(current.detail),
      [] as UnisatType<'activity'>[],
    ),
  );
}

const getBalanceOnBlockMemoized = memoizee(getBalanceOnBlock, {
  promise: true,
  maxAge: 300e3,
  length: 4,
});

export function getBalanceOnBlock$(
  address: string,
  block: number,
  offset = 0,
  limit = kUnisatPageLimit,
) {
  return from(
    getUnisatQueue().add(() =>
      getBalanceOnBlockMemoized(address, block, offset, limit).then(
        UnisatAPISchema.balance.parse,
      ),
    ),
  );
}

export function getAllBalancesOnBlock$(
  block: number,
  address: string,
  pageLimit = kUnisatPageLimit,
  totalLimit = Number.MAX_SAFE_INTEGER,
) {
  let offset = 0;
  return getBalanceOnBlock$(address, block, 0, pageLimit).pipe(
    expand(value => {
      if (value.data.data.detail.length === 0) {
        return EMPTY;
      }
      if (value?.data.data.total == null) {
        return EMPTY;
      }
      if (offset + pageLimit >= value.data.data.total) {
        return EMPTY;
      }
      if (offset + pageLimit >= totalLimit) {
        return EMPTY;
      }
      offset += pageLimit;
      return getBalanceOnBlock$(address, block, offset, pageLimit);
    }),
    reduce(
      (acc, current) => acc.concat(current.data.data.detail),
      [] as UnisatType<'balance'>[],
    ),
  );
}
