/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodType } from 'zod';
import { indexerAPI } from './api-model';
import { indexer } from './db-model';
import { Enums } from './enums-model';

export const Models = {
  database: {
    indexer,
  },
  enums: {
    ...Enums,
  },
  api: {
    ...indexerAPI,
  },
};

export type ModelOf<
  S extends keyof typeof Models.database,
  T extends keyof (typeof Models.database)[S],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = (typeof Models.database)[S][T] extends ZodType<infer O, any, any>
  ? O
  : never;
export type ModelIndexer<T extends keyof (typeof Models.database)['indexer']> =
  ModelOf<'indexer', T>;

export type APIOf<
  M extends keyof typeof Models.api,
  R extends keyof (typeof Models.api)[M],
  T extends keyof (typeof Models.api)[M][R],
> = (typeof Models.api)[M][R][T] extends ZodType<infer O, any, any> ? O : never;

export const m = {
  database<
    S extends keyof typeof Models.database,
    T extends keyof (typeof Models.database)[S],
  >(schema: S, table: T) {
    return Models.database[schema][table];
  },
  enums<T extends keyof typeof Models.enums>(type: T) {
    return Models.enums[type];
  },
  api<
    M extends keyof typeof Models.api,
    R extends keyof (typeof Models.api)[M],
    T extends keyof (typeof Models.api)[M][R],
  >(schema: M, request: R, type: T) {
    return Models.api[schema][request][type];
  },
};
