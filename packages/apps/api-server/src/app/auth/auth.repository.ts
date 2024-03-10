import { PersistentService } from '@meta-protocols-oracle/persistent';
import { Inject } from '@nestjs/common';

export class AuthRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistent: PersistentService,
  ) {}
}
