import { ZodType } from 'zod';
import { indexerJSON } from './api-model';
import { Enums } from './enums-model';
import { indexer } from './indexer-model';

export const Models = {
  database: {
    indexer,
  },
  json: {
    indexer: indexerJSON,
  },
  enums: {
    ...Enums,
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
};

