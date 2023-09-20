import { SQL } from '@alex-b20/commons';
import { PersistentService } from '@alex-b20/persistent';
import { DTOIndexer, Enums } from '@alex-b20/types';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Indexer Controller (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const persistent = moduleFixture.get(PersistentService);
    await persistent.pgPool.query(
      SQL.typeAlias('void')`truncate table indexer.txs cascade`,
    );
  });

  it('/api/v1/indexer/txs (POST)', () => {
    const data: DTOIndexer<'txs_with_proofs'> = {
      type: 'bis',
      header: '0x01',
      height: '1001',
      tx_id: randomBytes(32).toString('hex'),
      proof_hashes: [randomBytes(32).toString('hex')],
      tx_index: '0',
      tree_depth: '1',
      from: randomBytes(20).toString('hex'),
      to: randomBytes(20).toString('hex'),
      output: '1',
      tick: 'sat',
      amt: '100000',
      from_bal: '100000',
      satpoint: '3',
      to_bal: '100000',
      order_hash: randomBytes(32).toString('hex'),
      signature: randomBytes(64).toString('hex'),
      signer: randomBytes(20).toString('hex'),
    };
    return request(app.getHttpServer())
      .post('/api/v1/indexer/txs')
      .set('authorization', `Bearer 00000000-0000-0000-0000-000000000001`)
      .set('x-service-type', Enums.ServiceType.enum.VALIDATOR)
      .set('x-version', '0.0.1')
      .send(data)
      .expect(201)
      .expect({ message: 'ok' });
  });
});
