import { Inject } from '@nestjs/common';
import { RelayerService } from './relayer.interface';
import { RelayerRepository } from './relayer.repository';

export class DefaultRelayerService implements RelayerService {
  constructor(
    @Inject(RelayerRepository)
    public readonly relayerRepository: RelayerRepository,
  ) {}
}

const RelayerServiceProvider = {
  provide: RelayerService,
  useClass: DefaultRelayerService,
};

export default RelayerServiceProvider;
