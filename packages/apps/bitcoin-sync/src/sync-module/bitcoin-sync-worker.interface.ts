export abstract class BitcoinSyncWorkerService {
  abstract start(): Promise<void>;
}
