import type contracts from './contracts.json';

export const Contracts: Array<keyof typeof contracts> = [
  'utils',
  'clarity-bitcoin',
  'indexer',
];
