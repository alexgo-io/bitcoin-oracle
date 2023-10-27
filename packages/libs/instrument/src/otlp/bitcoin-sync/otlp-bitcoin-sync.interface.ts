export abstract class OtlpBitcoinSyncService {
  abstract recordBitcoinSyncInsertBlock(
    syncDuration: number,
    { height }: { height: number },
  ): void;
}
