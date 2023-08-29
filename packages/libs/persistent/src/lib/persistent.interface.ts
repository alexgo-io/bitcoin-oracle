import { DatabasePool } from 'slonik';

export abstract class PersistentService {
  abstract get pgPool(): DatabasePool;
}
