/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodType } from 'zod';
import { indexerAPI } from './api-model';
import { Enums } from './enums-model';
import { indexer } from './indexer-model';

export const Models = {
  database: {
    indexer,
  },
  json: {
    indexer: indexerAPI,
  },
  enums: {
    ...Enums,
  },
  api: {
    txs: indexerAPI.txs,
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

export type DTO<
  S extends keyof typeof Models.json,
  T extends keyof (typeof Models.json)[S],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = (typeof Models.json)[S][T] extends ZodType<infer O, any, any> ? O : never;

export type DTOIndexer<T extends keyof (typeof Models.json)['indexer']> = DTO<
  'indexer',
  T
>;

export type APIOf<
  M extends keyof typeof Models.api,
  R extends keyof (typeof Models.api)[M],
  T extends keyof (typeof Models.api)[M][R],
> = (typeof Models.api)[M][R][T] extends ZodType<infer O, any, any> ? O : never;

export const m = {
  json<
    S extends keyof typeof Models.json,
    T extends keyof (typeof Models.json)[S],
  >(schema: S, table: T) {
    return Models.json[schema][table];
  },
  database<
    S extends keyof typeof Models.database,
    T extends keyof (typeof Models.database)[S],
  >(schema: S, table: T) {
    return Models.database[schema][table];
  },
  enums<T extends keyof typeof Models.enums>(type: T) {
    return Models.enums[type];
  },
  api3<
    M extends keyof typeof Models.api,
    R extends keyof (typeof Models.api)[M],
    T extends keyof (typeof Models.api)[M][R],
    N extends `${M}:${R extends string ? R : never}:${T extends string
      ? T
      : never}`,
  >(
    name: N,
  ): (typeof Models.api)[M][R][T] extends ZodType<infer O, any, any>
    ? O
    : never {
    const [schema, request, type] = name.split(':') as [M, R, T];
    return Models.api[schema][request][type] as any;
  },

  api<
    M extends keyof typeof Models.api,
    R extends keyof (typeof Models.api)[M],
    T extends keyof (typeof Models.api)[M][R],
  >(schema: M, request: R, type: T) {
    return Models.api[schema][request][type];
  },
};
