import { Inject } from '@nestjs/common';

export class VaultRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistent: PersistentService,
  ) {}
}
