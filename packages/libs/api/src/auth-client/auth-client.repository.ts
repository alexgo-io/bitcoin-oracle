import { Inject } from '@nestjs/common';

export class AuthClientRepository {
  constructor(
    @Inject(PersistentService)
    private readonly persistent: PersistentService,
  ) {}
}
