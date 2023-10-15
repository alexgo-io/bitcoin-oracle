import { getLogger } from '@meta-protocols-oracle/commons';
import memoizee from 'memoizee';
import { EMPTY, expand, from, reduce } from 'rxjs';
import { getHiroQueue } from '../queue';
import { getActivityOnBlock, getBalanceOnBlock } from './api.raw';
import { HiroAPISchema, HiroType } from './schema';

const getActivityOnBlockMemoized = memoizee(getActivityOnBlock, {
  promise: true,
  maxAge: 300e3,
  length: 3,
});
export function getActivityOnBlock$(block: number, offset = 0, limit = 60) {
  return from(
    getHiroQueue().add(() =>
      getActivityOnBlockMemoized(block, offset, limit).then(activity => {
        const result = HiroAPISchema.activity.safeParse(activity);
        if (result.success) {
          return result.data;
        }

        getLogger('hiro-api-parsing').error(
          `Failed to parse activity on block ${block} at offset ${offset} with limit ${limit}, activity: ${JSON.stringify(
            activity,
          )}`,
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
  pageLimit = 60,
  totalLimit = Number.MAX_SAFE_INTEGER,
) {
  let offset = 0;
  return getActivityOnBlock$(block, 0, pageLimit).pipe(
    expand(value => {
      if (value.results.length === 0) {
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
      (acc, current) => acc.concat(current.results),
      [] as HiroType<'activity'>[],
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
  limit = 60,
) {
  return from(
    getHiroQueue().add(() =>
      getBalanceOnBlockMemoized(address, block, offset, limit).then(
        HiroAPISchema.balance.parse,
      ),
    ),
  );
}

export function getAllBalancesOnBlock$(
  block: number,
  address: string,
  pageLimit = 60,
  totalLimit = Number.MAX_SAFE_INTEGER,
) {
  let offset = 0;
  return getBalanceOnBlock$(address, block, 0, pageLimit).pipe(
    expand(value => {
      if (value.results.length === 0) {
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
      return getBalanceOnBlock$(address, block, offset, pageLimit);
    }),
    reduce(
      (acc, current) => acc.concat(current.results),
      [] as HiroType<'balance'>[],
    ),
  );
}
