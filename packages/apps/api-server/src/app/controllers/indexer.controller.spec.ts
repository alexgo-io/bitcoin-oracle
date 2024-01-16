import { Indexer, MockIndexer } from '@bitcoin-oracle/api';
import { SQL } from '@meta-protocols-oracle/commons';
import { PersistentService } from '@meta-protocols-oracle/persistent';
import { APIOf, Enums } from '@meta-protocols-oracle/types';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../app.module';
import { AllExceptionsFilter } from '../interceptors/all-exceptions.filter';

describe('Indexer Controller (e2e)', () => {
  let app: INestApplication;
  let indexer: Indexer;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    const persistent = moduleFixture.get(PersistentService);
    await persistent.pgPool.query(
      SQL.typeAlias('void')`truncate table indexer.txs cascade`,
    );

    indexer = moduleFixture.get(Indexer);
  });

  it('/api/v1/indexer/txs (POST)', () => {
    const defaultIndexer = indexer as unknown as MockIndexer;
    jest
      .spyOn(defaultIndexer, 'validateOrderHash')
      .mockImplementation(() => Promise.resolve());

    const data: APIOf<'txs', 'request', 'json'> = {
      type: 'bis',
      header: '0x01',
      height: '1001',
      tx_hash:
        '020000000001062FFB84277912EC3484CAE6EEC0C696C9CCDB30AF67119B0D89A4818BECBAE37E0400000000FFFFFFFF2FFB84277912EC3484CAE6EEC0C696C9CCDB30AF67119B0D89A4818BECBAE37E0500000000FFFFFFFF273BC51B980DDEC71A425DCF818BC89CCE58695FF7B0BA2A1BDB05530F5145170000000000FFFFFFFFFAB31782C52497557476A427E17D1ECD049F6B91ECB345F06C0BBD951F6C7BBF0100000000FFFFFFFFEE89F9CC38282E8BDC25FEAEFF40AC2EF988C6B0D9C29BB1A8534B50F62C08560100000000FFFFFFFF2FFB84277912EC3484CAE6EEC0C696C9CCDB30AF67119B0D89A4818BECBAE37E0000000000FFFFFFFF075802000000000000160014DAE7388C95B911CFC08B37078B1FF982741E180122020000000000001600145724F67BF087DCF5D402D83C7FCF97BB512C8EC8206250000000000017A9149A5E432BEF3184C9C19FCD34376FDEF665914F7387A0A400000000000016001432D1CD51E6858B8F6BA093BB2387A9843D91084805954700000000001600145724F67BF087DCF5D402D83C7FCF97BB512C8EC82C01000000000000160014DAE7388C95B911CFC08B37078B1FF982741E18012C01000000000000160014DAE7388C95B911CFC08B37078B1FF982741E18010247304402207BCD0BEB0A90407D3F3A6CC594FA95B04CD1DC6B9AEBA9D9911A4CA68067814702204AE3B14EA31995E0A9504174109C4D8ACB7322D11C2C931A2F038A742422434D0121037293DC1A35FD900CABF6D658FDE6B4FC2E1AD2767720A13C3DED4576F172D6C1024730440220797DB4EBCC8EF070FBA995F590F5114B55F30FFEA91D98621428A1EBB230251A02201F3A96333281F3E6A28D38F2192FBAF7AB5ED341316A4C0CAAE93596EEEDD8580121037293DC1A35FD900CABF6D658FDE6B4FC2E1AD2767720A13C3DED4576F172D6C10141E6A45A9CD03E151A377E7A3CFD00887261F4C3008799FC7EFD34FBC76C319C242D6585D1BC72ED27DCEEFEA8FC9813A7FE79B42C6C2151FDB0DCCF9DDEDF232B8302473044022017345178D610C4832E2A1FBA8C2D038D03BA9597EB0ACB51594CEF8761C04AE90220097BDD7AF5A458000C6A857BD0594E426AA8E763FB4699F399FAADAD738E29900121021DA7884C702F4A1A9053ADDA6C1EE7ADC48876EF3B69D54EF66E8DEF0A42E07D0247304402200DDAC9728C58E0BF3AFC25C44F6906C26574AEF7B0CAEAB481F5AEC5E22B758C022006B4160CA20FFB1701F239E46AE5F7088F33860675036997AA435AC4EB812AE30121021DA7884C702F4A1A9053ADDA6C1EE7ADC48876EF3B69D54EF66E8DEF0A42E07D02483045022100DB42AE15C7A1A4FF7B2651F3DFCDD5EBD01F247DCD3B6AB1C88121681C9D6C0802200BF6AD644577D92E554172DB7D71CE5512FFD4633D907C42C6B4BE686AFB60B50121037293DC1A35FD900CABF6D658FDE6B4FC2E1AD2767720A13C3DED4576F172D6C100000000',

      proof_hashes: [randomBytes(32).toString('hex')],
      tx_index: '0',
      tree_depth: '1',
      from: '0x512028E75B62798B632D1F214E13586B3B91D0F0BE9C84D2E9F4868EB1DBCE66C3DE',
      to: '0x00145724F67BF087DCF5D402D83C7FCF97BB512C8EC8',
      output: '1',
      tick: 'sat',
      decimals: '18',
      amt: '100000',
      from_bal: '100000',
      satpoint: '3',
      to_bal: '100000',
      order_hash: randomBytes(32).toString('hex'),
      signature: randomBytes(64).toString('hex'),
      signer: randomBytes(20).toString('hex'),
      signer_pubkey: randomBytes(33).toString('hex'),
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
