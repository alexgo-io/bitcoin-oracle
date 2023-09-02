import { PersistentService } from '@alex-b20/persistent';
import { Inject } from '@nestjs/common';

export class RelayerRepository {
  constructor(
    @Inject(PersistentService) private readonly persistent: PersistentService,
  ) {}
}
