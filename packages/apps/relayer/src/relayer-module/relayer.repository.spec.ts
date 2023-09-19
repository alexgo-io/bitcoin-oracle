import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RelayerService } from './relayer.interface';
import { RelayerModule } from './relayer.module';

describe('relayer.repository', () => {
  let app: INestApplication;
  let relayerService: RelayerService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RelayerModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    relayerService = moduleFixture.get(RelayerService);
  });

  it('should define relayer service', () => {
    expect(relayerService).toBeDefined();
  });
});
