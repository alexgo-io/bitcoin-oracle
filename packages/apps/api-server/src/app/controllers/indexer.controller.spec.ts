import { SQL } from '@alex-b20/commons';
import { PersistentService } from '@alex-b20/persistent';
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
    return request(app.getHttpServer())
      .post('/api/v1/indexer/txs')
      .send({
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
        bitcoin_tx: randomBytes(32).toString('hex'),
        from_bal: '100000',
        to_bal: '100000',
        order_hash: randomBytes(32).toString('hex'),
        signature: randomBytes(64).toString('hex'),
        signer: randomBytes(20).toString('hex'),
      })
      .expect(201)
      .expect({"message":"ok"});
  });
});
