// deno-lint-ignore-file no-explicit-any
import {
  Account,
  assertEquals,
  buff,
  Chain,
  Clarinet,
  headerToTupleCV,
  prepareChainBasicTest,
  proofToTupleCV,
  signPackToTupleCV,
  Tx,
  txToTupleCV,
  types,
} from './includes.ts';

// https://mempool.space/api/tx/70796b5087799c71965a35d8a8add91f2fc14cab6baac6c58fd2c5fe48913611
// pnpm tsx scripts/extract-tx-data.ts 70796b5087799c71965a35d8a8add91f2fc14cab6baac6c58fd2c5fe48913611
const deploy_txid =
  '0x70796b5087799c71965a35d8a8add91f2fc14cab6baac6c58fd2c5fe48913611';
const deploy_data = {
  burnHeight: 789219,
  height: 105098,
  tx: '02000000000101df8ef516ae29b6f5320e6f7be966d134073fd608187de50c58821672e35896f00000000000fdffffff02220200000000000022512097c010ad464a48b77491113aded0570ce8b32090ba925b6290e5ba97268e3c7c1a0d000000000000160014b492459705c999f9c4ec329a815d3a32909cd880034022cf8cb19d3ae16f174dd965ea310bc03387e99bda8ff0cf6998f085687c0e6c03de7dbfab5b7dcfe0f48344b66cbbe23f4bb26e5ba39a7d814f2c684bddfe0f9b20117f692257b2331233b5705ce9c682be8719ff1b2b64cbca290bd6faeb54423eac061234cf098801750063036f7264010118746578742f706c61696e3b636861727365743d7574662d38004c4c7b2270223a226272632d3230222c226f70223a226465706c6f79222c227469636b223a2224423230222c226d6178223a223231303030303030222c226c696d223a223231303030303030227d6821c0117f692257b2331233b5705ce9c682be8719ff1b2b64cbca290bd6faeb54423e00000000',
  header:
    '000099247386511af242d00e8ee3773996d90c293e0b8e3974ba0500000000000000000050ae942b1b7052581eff46d43d26d4133cc3ce9a7be1cbb81318c27b54cf27099d9f5c6401dd051722911240',
  proof: {
    'tx-index': 603,
    hashes: [
      'a1f6564581a409bf3d52c87ea8164e0899d20df9c946af2794d4b408a10a86d9',
      '5ee7f8ae5576636d2b36540164b12a8c7f171a382e92b3313c999c022ad62b59',
      'e95ccfd8da89610069cd08dca041ac587bace26880a1f6b3847ff56c78068b06',
      '1b239752cb61b6dbd6726795af70e7a2cdaee3929c51a1f655417fc22ebd3c0a',
      '0b7bb231b7e8a6bb4cf4967444efd4f28ae95370781e634dba7273016f488fcf',
      '5af25cccb1eead88515d34e068f19e9d1f5d1a7d33ce4f5d1ada6d92364ce3dc',
      'bee7d7710e557deb14cf7961c19c981afb70ffc307c1695c24362eaf37e5cd0c',
      'ebac6ae575e22cdb63847931454d8ca828c6cae6ec85b2aab35c32057133d354',
      'd6a106be86e0b533bd7459c589b0abd317fa6fe84bd83676188a2bf493a10093',
      '65a68bc14a6555d287ce799659ca0b3225df9df5dbf18992763267d5852637e4',
      '462e3648c61f1e3033d009e3447ad5cba5d85be96c7525e8cef391a6c9170e6f',
      '4fb85cf869308cd73f73258a9d10f5e07da27cf54b2d49290ab0b85476f42e57',
      '0cab2ef841bbd34607ff152fa4fdd7dc33b06cd34a8a21cd91bf0321a3c60f0a',
    ],
    'tree-depth': 13,
  },
};

// https://mempool.space/api/tx/2e951004175cbc4a0a421efbb5a42aaa4e4708c1bc15a08ab03e41020336603b/hex
// pnpm tsx scripts/extract-tx-data.ts 2e951004175cbc4a0a421efbb5a42aaa4e4708c1bc15a08ab03e41020336603b
const transferrable_txid =
  '0x2e951004175cbc4a0a421efbb5a42aaa4e4708c1bc15a08ab03e41020336603b';
const transferrable_data = {
  burnHeight: 794680,
  height: 109655,
  tx: '01000000000101885a283122b9897aa8ccfbd1b6ee8e88a81f297039506f1310ac0999fd0ec1c20000000000fdffffff01220200000000000022512053687745b1a04c2d74da5f1aa12d285df92626384fc5697de94ba6b9b9afee650340703b0cf0c88bd1e890d5b52a425cd37d4fa35e911423bf6306faeff09a98ff5c5afaf79fe02b5423771c2396abec0851af8d59896f5960b1869aa2d6323ea8927f2006449df0d86cb0c82057dfaa9dad498131215190799a442772d3407e0c0b02a7ac0063036f7264010118746578742f706c61696e3b636861727365743d7574662d3800397b2270223a226272632d3230222c226f70223a227472616e73666572222c227469636b223a2269676c69222c22616d74223a2232303030227d6821c106449df0d86cb0c82057dfaa9dad498131215190799a442772d3407e0c0b02a700000000',
  header:
    '0040002094c612a35b16f031dc589dccef93a671e763e00efc6c02000000000000000000f42688ac3b24036b38263f73f1ba1ae5924057fe8a6390b25e8b367f2fe0f53bf3f68c646d6005179da8a102',
  proof: {
    'tx-index': 382,
    hashes: [
      '417dbc049f86e060b862073054469b9da9bc92e6a8f39d94c0344f4e1355e3b4',
      '1a92bb4b9d4d821ea26b33503a24f132d8ac49cf085543a28da684f32b3d197b',
      '6e19bc2d92439878adb32a0298191fac2fc05781ca5f3e266fcb2b588b20e3c9',
      'b5ccdf94b47093853aeb465170a51be66b92c1043ae120552ff5eb191d522c50',
      '15434283b374b5e4289e4f4aa44b1321b5db03747139d7cabcf4c611eb941f53',
      'a4def5491336a883410b653ec91162acf4bfe853e2a6287ad6d6f4337f9a60bb',
      'a969dde4d0c97d87a2b9704344127aaeb26a1678897632f31610bfd8dd5d8d77',
      '504461d569bd51ab1c8c51ee1e834fe19fd5936fb6a9aaecfb348fb2926436c3',
      '460b473528cc1e9306c8a316add3260ea2339bc43de8dfebfb69448394911f95',
      'c7aef7e665ec086443a282d1fff887f43ebd79728b6a2dbe4b18d7635f0793bf',
      'd383fbfea7f4268208cbc92e3ae879eb6b4b3cc323bafb5185426c3decb593dd',
      '5f33844bff468cb7f0d5104ce9c5c266b0b125db2e5f8b55458a8c66d9487192',
    ],
    'tree-depth': 12,
  },
};

// https://mempool.space/api/tx/5760346ab0ebb18084432eea1c8f921f36e2517e0e3fea9741a1523cd5e47feb/hex
// pnpm tsx scripts/extract-tx-data.ts 5760346ab0ebb18084432eea1c8f921f36e2517e0e3fea9741a1523cd5e47feb
const transfer_txid =
  '0x5760346ab0ebb18084432eea1c8f921f36e2517e0e3fea9741a1523cd5e47feb';
const transfer_data = {
  burnHeight: 794819,
  height: 109769,
  tx: '020000000001023b60360302413eb08aa015bcc108474eaa2aa4b5fb1e420a4abc5c170410952e0000000000ffffffffad4836f6077e2a02a2ac0198a70374759f8fece545d2c0e12b5ba9ca9efc3fc50400000017160014770dea24279344035fbb90eab3a156b43c183decffffffff022202000000000000225120c981bdfa5eaab9d6d0da158144e1c519411e76bf11e4c5deba73b358431b53b70a7300000000000017a914fe8b7a0c78c3af44ceea9e2b033d9220631ecf9e8701401442fa68d11c85791ffd3a7efa5ceedaa4bb51ee280c0b428f4ce2c6041261a1bee22084c073efff332d6264db9e84533d8aed41ddaee96cb166fdbb70a634f802483045022100eedf43522e4fb9c7c8aa1daddf31f2f48aaefb0741a14d5b1dc390420b8bca2c02207718fe6f3dfd1291bc4cafd6ef73c58237df20528737029dd15f35d18d611ef6012103f7cefdc7515124973cb02a6f17704e254e08f6025636e68f43ebee86fe3c724100000000',
  header:
    '00000020aeb0b24d2d6a052c12063dce70db5cef3b32d4b2feed00000000000000000000f4f2231eacd683f14838228cc7d4221f4a86f163ba5f0e35f94b35d2f0a72062d63e8e646d600517382e2a5c',
  proof: {
    'tx-index': 1151,
    hashes: [
      '55d4e980d84c3c31f3b9538dcf56a4bf8a11ec280175f3a8b96e32e255dc7e3c',
      '52a0646be2f03c64108eee7948f8ac3fa0add274ac06e5756d8ff585e1d25481',
      '572ce337af6f2777b1266d6cfc5860a62b5821cc494b5c867e136a0464dae744',
      '578abb65f25709c21232dd2ac13e1e89fc97f1b1c06404a4d97321720500c38b',
      '015458b49f57c7d35d23e48b0a821d7def627d3716e31e29a645ac0b4d96253e',
      'e85afa448d20154aa410e95658ee31d1732930817b8659b35b0c9ecf3095ca5a',
      'f0d3a992cc972edf0db390cf97e55e7e8fb0a4e08f10c236ba5dbb5e4174bb80',
      '24ff2881c0dfb8f2fcd4d88582bdc0cce1b8997ed074b06a7da7260f7831b46c',
      'efadcaddbc4b6832a1b553d40736636b0de91a81996a1c66feddd84a59849f6f',
      '9b8e5adaa212bd9538af596692e33f5a78b5023d34787c051a9efe35b208932f',
      'c981bdb80b48bcd489d4974240607186b1de49e4b52819ace0f45f623586fdde',
      '359a0995c03c1c2b961122f770fcfe8ecd9095bb94eb98111139848badee2891',
    ],
    'tree-depth': 12,
  },
};
const transfer_event = {
  amt: '2000000000000000000000',
  'bitcoin-tx':
    '020000000001023b60360302413eb08aa015bcc108474eaa2aa4b5fb1e420a4abc5c170410952e0000000000ffffffffad4836f6077e2a02a2ac0198a70374759f8fece545d2c0e12b5ba9ca9efc3fc50400000017160014770dea24279344035fbb90eab3a156b43c183decffffffff022202000000000000225120c981bdfa5eaab9d6d0da158144e1c519411e76bf11e4c5deba73b358431b53b70a7300000000000017a914fe8b7a0c78c3af44ceea9e2b033d9220631ecf9e8701401442fa68d11c85791ffd3a7efa5ceedaa4bb51ee280c0b428f4ce2c6041261a1bee22084c073efff332d6264db9e84533d8aed41ddaee96cb166fdbb70a634f802483045022100eedf43522e4fb9c7c8aa1daddf31f2f48aaefb0741a14d5b1dc390420b8bca2c02207718fe6f3dfd1291bc4cafd6ef73c58237df20528737029dd15f35d18d611ef6012103f7cefdc7515124973cb02a6f17704e254e08f6025636e68f43ebee86fe3c724100000000',
  output: '0',
  offset: '0',
  tick: 'igli',
  from: '0x512053687745b1a04c2d74da5f1aa12d285df92626384fc5697de94ba6b9b9afee65',
  to: '0x5120c981bdfa5eaab9d6d0da158144e1c519411e76bf11e4c5deba73b358431b53b7',
  'from-bal': '2000000000000000000000',
  'to-bal': '2000000000000000000000',
  decimals: '18',
};

Clarinet.test({
  name: 'clarity-bitcoin: can parse and verify tx',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    const transferrable_parsed = chain
      .callReadOnlyFn(
        'clarity-bitcoin',
        'parse-wtx',
        [buff(transferrable_data.tx)],
        deployer.address,
      )
      .result.expectOk()
      .expectTuple();
    const transfer_parsed = chain
      .callReadOnlyFn(
        'clarity-bitcoin',
        'parse-wtx',
        [buff(transfer_data.tx)],
        deployer.address,
      )
      .result.expectOk()
      .expectTuple();

    const inscribe_header_hash = chain.callReadOnlyFn(
      'clarity-bitcoin',
      'get-txid',
      [buff(transferrable_data.header)],
      deployer.address,
    ).result;
    let block = chain.mineBlock([
      Tx.contractCall(
        'clarity-bitcoin',
        'mock-add-burnchain-block-header-hash',
        [types.uint(transferrable_data.burnHeight), inscribe_header_hash],
        deployer.address,
      ),
    ]);
    block.receipts.map((e: any) => {
      e.result.expectOk();
    });

    console.log(
      `can get classic txid of segwit tx: ${
        chain.callReadOnlyFn(
          'clarity-bitcoin',
          'get-segwit-txid',
          [buff(transferrable_data.tx)],
          deployer.address,
        ).result
      }`,
    );
    console.log(
      `can get wtxid of segwit tx: ${
        chain.callReadOnlyFn(
          'clarity-bitcoin',
          'get-txid',
          [buff(transferrable_data.tx)],
          deployer.address,
        ).result
      }`,
    );

    console.log(
      `can verify block header: ${
        chain.callReadOnlyFn(
          'clarity-bitcoin',
          'verify-block-header',
          [
            buff(transferrable_data.header),
            types.uint(transferrable_data.burnHeight),
          ],
          deployer.address,
        ).result
      }`,
    );

    console.log(
      `can verify if segwit tx was mined ${
        chain.callReadOnlyFn(
          'clarity-bitcoin',
          'was-segwit-tx-mined?',
          [
            headerToTupleCV({
              header: transferrable_data.header,
              height: transferrable_data.burnHeight,
            }),
            buff(transferrable_data.tx),
            proofToTupleCV(transferrable_data.proof),
          ],
          deployer.address,
        ).result
      }`,
    );
  },
});

Clarinet.test({
  name: 'indexer: can hash, validate and index',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const validator = accounts.get('wallet_1')!;
    const relayer = accounts.get('wallet_2')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    // please note test does not check if tx is mined.
    const tx = transfer_event;
    const header = {
      header: transfer_data.header,
      height: transfer_data.height,
    };
    const proof = transfer_data.proof;

    // ts-node scripts/generate-tx-hash.ts 'tx'
    // { "amt": "2000000000000000000000", "bitcoin-tx": "020000000001023b60360302413eb08aa015bcc108474eaa2aa4b5fb1e420a4abc5c170410952e0000000000ffffffffad4836f6077e2a02a2ac0198a70374759f8fece545d2c0e12b5ba9ca9efc3fc50400000017160014770dea24279344035fbb90eab3a156b43c183decffffffff022202000000000000225120c981bdfa5eaab9d6d0da158144e1c519411e76bf11e4c5deba73b358431b53b70a7300000000000017a914fe8b7a0c78c3af44ceea9e2b033d9220631ecf9e8701401442fa68d11c85791ffd3a7efa5ceedaa4bb51ee280c0b428f4ce2c6041261a1bee22084c073efff332d6264db9e84533d8aed41ddaee96cb166fdbb70a634f802483045022100eedf43522e4fb9c7c8aa1daddf31f2f48aaefb0741a14d5b1dc390420b8bca2c02207718fe6f3dfd1291bc4cafd6ef73c58237df20528737029dd15f35d18d611ef6012103f7cefdc7515124973cb02a6f17704e254e08f6025636e68f43ebee86fe3c724100000000", "output": "0", "offset": "0", "tick": "igli", "from": "0x512053687745b1a04c2d74da5f1aa12d285df92626384fc5697de94ba6b9b9afee65", "to": "0x5120c981bdfa5eaab9d6d0da158144e1c519411e76bf11e4c5deba73b358431b53b7", "from-bal": "2000000000000000000000", "to-bal": "2000000000000000000000", "decimals": "18" }
    const txHash =
      '0xf2b6d8dd4ba6c1b0bc8d23a27e6516bc00ca35f17f60c175726bed2029faf543';

    // ts-node scripts/sign-tx-hash '7287ba251d44a4d3fd9276c88ce34c5c52a038955511cccaf77e61068649c17801' 'txHash'
    const signaturePack = {
      signature:
        '0x8668c044dfb87d4f4f17403a2d452e0752a0b0fdb172dee83bf825643c5c9b302f67e3f2e3da06636f501ce9f7d52a902b5995e896b44e1774deefc711df9e8501',
      signer: validator.address,
      'tx-hash': txHash,
    };

    const hashed = chain.callReadOnlyFn(
      'indexer',
      'hash-tx',
      [txToTupleCV(tx)],
      deployer.address,
    ).result;
    assertEquals(hashed, txHash);
    console.log(`can hash tx correctly: ${hashed == txHash}`);

    console.log(
      `can validate tx: ${
        chain.callReadOnlyFn(
          'indexer',
          'validate-tx',
          [txHash, signPackToTupleCV(signaturePack)],
          deployer.address,
        ).result
      }`,
    );

    let block = chain.mineBlock([
      Tx.contractCall(
        'indexer',
        'index-tx-many',
        [
          types.list([
            types.tuple({
              tx: txToTupleCV(tx),
              block: headerToTupleCV(header),
              proof: proofToTupleCV(proof),
              'signature-packs': types.list([signPackToTupleCV(signaturePack)]),
            }),
          ]),
        ],
        relayer.address,
      ),
    ]);
    block.receipts.map((e: any) => {
      e.result.expectOk();
    });

    //   const rawData = [
    //     {
    //       block: {
    //         header:
    //           '0x00000020a1665cc8b36381ee4f425d5becc9a4ba31ba7fa89d8001000000000000000000663432fcb07247f660ddd7841f0095e709fe9051d3760236856617058168985892040e657fed0417a9464545',
    //         height: '808890n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xbf507e6c814176dcb63fa663c322cc2945cff67558f978f7eb2c08b9b3156c9c',
    //           '0xde5eaa1459dc514ea338187aa5b89bae1cdb66c9c00b61f4935e25c950185fd6',
    //           '0x7c12c7b522c5246bfac86bd56af95835381003cd5cf6aff231d9afb4323d1e3a',
    //           '0xb0be6eddb978d9138b0933d736ab728f0854feea0ea8d9843c87cf388f1a1e51',
    //           '0x025b36729dc9e3fb10a4441becb27c125cab22591cc66a44f1f3740938809fa3',
    //           '0x8c0354d32ff0e4f69a253c5f4ae63fb0dc688cfff660458256b3b0333624339c',
    //           '0x374cbefa0e39bcaadf5b1b285b1ed1bf3013afb36ca97e2f2b4692619ae04b10',
    //           '0x9e911d8f1a9d584e49473c721f1cbf0657f72394bc661f69b57d3135086a7391',
    //           '0x0d11f5576e12ddaa5ff01a557754ca956f33a3539be88623d4b04c75423f35d8',
    //           '0xc714e012f6a3a94ec1f84b5333bb5ef745133657509beea1cf3aef3385b6d131',
    //           '0xe6f3b0d9a5773b7a397dc1243ae3e08f7f10a8b175627effcd5c4fb45617cc38',
    //           '0x9ed3c34b8199b76133627b9f34fda396e6026edf29c84769ffc1c0b215f91adb',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '2233n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x867680a3f243abb3eea826ccf82567dc5bbc64fdb7da16e54843705e03e7da86725bb22835363c13d086b15c0400a8a0678c1424a20e7286be6769c4998bd1e300',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x88f6883af2023ce7b5d908c903ce28979678fefe564af8dbf3981da98c9cc668',
    //         },
    //       ],
    //       tx: {
    //         amt: '100000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000104bf507e6c814176dcb63fa663c322cc2945cff67558f978f7eb2c08b9b3156c9c0000000000ffffffffbf507e6c814176dcb63fa663c322cc2945cff67558f978f7eb2c08b9b3156c9c0100000000ffffffff95a588658d0c656f2bbcec894e9a5601550b35f59111e834179a35bb72f9ea2f0000000000ffffffffbf507e6c814176dcb63fa663c322cc2945cff67558f978f7eb2c08b9b3156c9c0200000000ffffffff06b004000000000000225120ce22bb6173dbf0017cdc414f6f6a0f11f4bb25c28bc98fae28b00c4ac71688944a01000000000000225120ce22bb6173dbf0017cdc414f6f6a0f11f4bb25c28bc98fae28b00c4ac716889420fd4b0000000000160014c88e88bd6d4d87976f1899188ac21a431704fdb45802000000000000225120ce22bb6173dbf0017cdc414f6f6a0f11f4bb25c28bc98fae28b00c4ac71688945802000000000000225120ce22bb6173dbf0017cdc414f6f6a0f11f4bb25c28bc98fae28b00c4ac71688946e120f0000000000225120ce22bb6173dbf0017cdc414f6f6a0f11f4bb25c28bc98fae28b00c4ac71688940140f57ee421bcf2ba39f3c29770964c3566ec7123c635f95d2ac3be8ce9216f1338f96fd857ff137df868f73dce86b843a2e7bceb0bf6b4ebd6cbbdc7e80bf055cb0140a824112c30d41157e96ab6340b5d74ac25c553b022f1be168277b833af709881837095c72a13f14b9ad7c469b7f477a7d67315a105df3345bdf5693e492ec1210247304402201fa9a3faab4251c28009fbc9d46f4ed85b7eb6910e0b40eeffbf284802783e7502207da2379d2b6f5e194f27ce602b02158c8d5d03bcc942b90a29bab0f9244caa5d832103bf4de4b21aad381be6917ae8e1d4a6efbc7187d898d669e42384e43ca38ab74e01401a9fd9ae808e0cee4fb1f91add30fe8b0475ea51e8a07e7d54b1ac1529efb39ea6ea294aab0714319f8a16c6eaf28a159514e9dda3db3636c04fb716149c619400000000',
    //         from: '0x0014c88e88bd6d4d87976f1899188ac21a431704fdb4',
    //         'from-bal': '4899999936000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120ce22bb6173dbf0017cdc414f6f6a0f11f4bb25c28bc98fae28b00c4ac7168894',
    //         'to-bal': '100000000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00000020a1665cc8b36381ee4f425d5becc9a4ba31ba7fa89d8001000000000000000000663432fcb07247f660ddd7841f0095e709fe9051d3760236856617058168985892040e657fed0417a9464545',
    //         height: '808890n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xb941d36fd3bc08cf55be4ed84269051e6027a7c6755efbe5189d705d4ebcfc4f',
    //           '0x945caac4668e09190379bdd0d5a23ac507d0ccf09efbc544b1a9242b164202a4',
    //           '0x87b313c62c8d46fc1b5ae3e775690a15ff84e37bb9ea06532c2d542696bb29a0',
    //           '0x808599841d32a0c240dfe84dcbe55c2947048c5e1abd7e16d21375e5a20f3db7',
    //           '0x5c4464517b58c8f30a536f4bf5acf4f0c9d2f6906bcff1536601bf19bc1c4cf1',
    //           '0x6c408365d0d3203086e8cc6f64d9270e0406e991a76d5c0ba0b8186afb5a8e6d',
    //           '0x562580fc320bacb74e408a8c7bb8ecfc8a802e33783cd7bcb7ff15a526a9eb84',
    //           '0x4775cac7a95c98ea9a812dc46e39244442ba4dca30dee5c52612f2f61cb1ac5c',
    //           '0x7e8a2289d1f7b5dcc8669e22385f4b4363486809af1315554551cd7ab456afc2',
    //           '0x536951f967abec7652d0d549df7d0366cd6a7cc870cb227f3dca57ca1fc82296',
    //           '0xe6f3b0d9a5773b7a397dc1243ae3e08f7f10a8b175627effcd5c4fb45617cc38',
    //           '0x9ed3c34b8199b76133627b9f34fda396e6026edf29c84769ffc1c0b215f91adb',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '2604n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x7cf900862dd5290c430bbc002ce816c484ad7716283c6689562039b0755af3456efad867e8fc774fa66456dc86829036f27f65c6569c9d2d434b87e3b4bcb4ff00',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x40611960cc885b41b6e877ad03125c2448c298a7e97b483e35f8a23eb2afafd3',
    //         },
    //       ],
    //       tx: {
    //         amt: '20000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000102d617188d9bd8fd87f40d7d4234696224278eadab2f604a350a6f5e36ff1bf3150000000000ffffffff2d588dc6030f3471d83d2c0be26037cb6ba9d09174e2c1a678255ffef58ee8120100000000ffffffff0222020000000000001976a9146de69fd689cc8cb2e5ba5c97aa3995c79e2960eb88ac710231000000000016001438098344773f0fbd85af4b872c55c04ca5e7a2130247304402205bda640234ade8342ce3b364617693eb8f72401c2633036dcf37dc05ce8c8b9e0220250da33b036db8d96f4de48426fe0eb70c4d2f4396c96a241a9d0ab2dfbac441012103ce609d33f7d4cbe99ef81f7508396180a8138bac66efa3d91ce8a048199cad2002483045022100e2e42cf8b52208971c03584c7f28978440b968e08cd47ea32da5c74b67f133ff022010e81e7897409679d26b9f735bb34a9db699dd331cab33d9faae9c42ba26c34e012103ce609d33f7d4cbe99ef81f7508396180a8138bac66efa3d91ce8a048199cad2000000000',
    //         from: '0x001438098344773f0fbd85af4b872c55c04ca5e7a213',
    //         'from-bal': '0n',
    //         offset: '0n',
    //         output: '0n',
    //         tick: 'vmpx',
    //         to: '0x76a9146de69fd689cc8cb2e5ba5c97aa3995c79e2960eb88ac',
    //         'to-bal': '21320000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x006001201bce84be8be3a4f83a587fed2800e2da163fa93bf43803000000000000000000a72a2a9b00994d7f0760cb7097e042482e3f6472b058772e8f77bc1bad719e8bed050e657fed0417b5ca3e0a',
    //         height: '808891n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xfccbe79c1b83097b7b313dab4cdfbf76b0a357551d20022a71cbc225bfc30e53',
    //           '0xab6368f099f6a416d9fe1b668fa8822e73847e98f1b7a1a15e4294583a999bba',
    //           '0xe12b98ea48941aa61531075c18e888f9bccd834d0b3cc60ba3aa4403bc175159',
    //           '0x201766d855fb6617a886ba546f1583b96f38c41e0888a0024fe1eefd1a2bf678',
    //           '0x0090ebcc779c1b3a42042a62c28c8971627954686561c93c22e9b8339185244b',
    //           '0xffeeb4505a791ee7340b5fb479aa89ef07089cc18429db70ca5fbaed02e5ab0a',
    //           '0x735bd0c04cfae3b09b3c1f89fe392d5665bcccbc6b45e23606e20b292adc1dc7',
    //           '0x957b0040fbf3c973293ff6491b412f2b23cf06c93eb708509efb136dcabbc8e5',
    //           '0xd681e2d51753970efe0c9620926bed0ea3f5ad32e1930673c070db4e656424ef',
    //           '0xac76e1759a44a16ade4e87a3c2be4a8bc03f517a285ae1ad9101ee6c944b5f60',
    //           '0xf24ea2870d33d905c148f8214246573d2bc818c4af5c8a6fed717a3ef9709718',
    //           '0xd46634e4d1158efe8f2faa927ec646285fdb00a9705bc847dfdd86b614b97546',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '862n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xd5df1937338483da5a1b8d4440321cca4937b1c6685252340dd920300191aafe33646829308c5946a9cdeb9079c8ee4639fc8f52545cc28457b642a78744db0001',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x36f84060882f05caab50c33016600b43bdd65a3d15c0cd0cd15203d99e7114e0',
    //         },
    //       ],
    //       tx: {
    //         amt: '500000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000105e0d3c2a58151c05d3792415dd514f472cfe8540b7e34086ea4d93d9a9b13c1700400000000ffffffffe0d3c2a58151c05d3792415dd514f472cfe8540b7e34086ea4d93d9a9b13c1700500000000ffffffff82d739e22ae19675348df26e4ff1cdebe55dc8ee9ea1712fe515b70c707ce0470000000000ffffffff7c0d27db4a73207c91728366351f033b3d6d9dabc2d670644ae30c5433d035e30b000000171600146a43ae94f98f1c439e0d601a5766a35498f66c50ffffffffe0d3c2a58151c05d3792415dd514f472cfe8540b7e34086ea4d93d9a9b13c1700000000000ffffffff065802000000000000160014b780d7cdcdd433d5dcc71b76f2975eafe5c944aa22020000000000002251207dcc35d5c7ac311d99960e3f969d989af9945053e5c6100fccb567832afb6b4f0a73000000000000225120794a6fdd872c2c1cd83c96f5d159f787d85568d63e8852d1de94f1fc3c60af117d4001000000000017a9144014b0c1530c0fb7003ce669f4d6d97f4a5869a1872c01000000000000160014b780d7cdcdd433d5dcc71b76f2975eafe5c944aa2c01000000000000160014b780d7cdcdd433d5dcc71b76f2975eafe5c944aa0247304402207bd7071dbc4f031af0e4f8b728fdc3ccf1205915f436aeca2f8407bab4a4849f0220711c95b4a91cbfd93a3c00a57008930f1db571f852159f2155d8f01a7cd80d29012103b379326a37d162fa514e912bb1e1b3272d02cc964c2a9ebedf1277a9a4138282024830450221009d44296b390acde7453f62f349a01b48c1f7bf1ceabb1363f661358f5d92cf0f022023a7fa8386dd8cc3eaa24dbf64774a361c3a1add076398dbd8db932da1d4eb63012103b379326a37d162fa514e912bb1e1b3272d02cc964c2a9ebedf1277a9a41382820141c1fb363e6a38a6d09041de355d93636b0d993dacdf770b56897ac1117d3fc2fb69ba0ab6b5b0cea219a8d7199ec3e67bce09de98e3fd2de6378c28ba671d611a830246304302204ef144c74aacd0a2d8b9791f67fec0b8e25886539170619fedffd7f855463c29021f63e744e5c290735797cfc690e4c7f60d7528f36296c53e5e64163bb5b627aa012103a1c3977d8984f93d1f947ef02886168b8804406b9a72df36c7e94238558d73c4024730440220263786e41e79cb08c1d7111b6fff95096f9836ffa69a3f4b281332fd798bb3c1022012da35aafd6e3fd6287ed250af107dfa575a566e049c6e388cbc603d49e718ad012103b379326a37d162fa514e912bb1e1b3272d02cc964c2a9ebedf1277a9a413828200000000',
    //         from: '0x5120794a6fdd872c2c1cd83c96f5d159f787d85568d63e8852d1de94f1fc3c60af11',
    //         'from-bal': '287699999672000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x51207dcc35d5c7ac311d99960e3f969d989af9945053e5c6100fccb567832afb6b4f',
    //         'to-bal': '2600000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x006001201bce84be8be3a4f83a587fed2800e2da163fa93bf43803000000000000000000a72a2a9b00994d7f0760cb7097e042482e3f6472b058772e8f77bc1bad719e8bed050e657fed0417b5ca3e0a',
    //         height: '808891n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x10bf144105663f4fd2895d1ae3487c81d9712221944cd93798ac34fdbd00c2fe',
    //           '0x428a2fdc866abe7efe8d9544967a6f8e9b63abc22f7f7eb2e5375d09a3617ee4',
    //           '0xe731822192dbcf94c316d274eca7fc61ee1efadbbc7b888054ce966709c2ac27',
    //           '0x01e369e103b46d1b5e8cb89cf02ddf2feac5e9564f8134bef85e068e18ae1045',
    //           '0x2738dbfa1e7d3236de51c2c6a6c37c99635ab5231a965b6f547accab74ed7ec7',
    //           '0x5ccae3a3e0517049f3579e20f3734cc575221168eb957f53a0feff0eea0b74aa',
    //           '0xc4dcd4c0651342442eb0a19e18f0c2167bf5b40c386fb65edaa79ec2d673f652',
    //           '0xf2dd6bd8d9e687125c13523165b547f5cc7a1231922e934c76eef21499932e26',
    //           '0xd681e2d51753970efe0c9620926bed0ea3f5ad32e1930673c070db4e656424ef',
    //           '0xac76e1759a44a16ade4e87a3c2be4a8bc03f517a285ae1ad9101ee6c944b5f60',
    //           '0xf24ea2870d33d905c148f8214246573d2bc818c4af5c8a6fed717a3ef9709718',
    //           '0xd46634e4d1158efe8f2faa927ec646285fdb00a9705bc847dfdd86b614b97546',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '955n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xb629a7910a55b7afac9ad6cb5dd1734dd9def6b5fc5852fd9d123bcac5c86a290ff6c0eeca1ea0b608ef2c76c70c00e6f8ad5626c4171967eeab884bf592446601',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x6b8a1efaddd7b057d9b8a037a80c4c41ec9ce18efa58f7e693ba7b844bdedd41',
    //         },
    //       ],
    //       tx: {
    //         amt: '1221000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000106001e6c773a903300a30a4e0a7c87f930dfda7b66d23a6b2f473003fd0f7ef17a0500000000ffffffff001e6c773a903300a30a4e0a7c87f930dfda7b66d23a6b2f473003fd0f7ef17a0600000000ffffffff7e14cb0778c1f03d80df55cd506f8abb2901d763b19cdef3f1f593a0b89b0c590000000000ffffffffcb4e13eb930b7f074c71ce2a941caa3ebf662f1cd41cba4a908af9891b8ad4280400000000ffffffff6a3b3c0e5e9b13853b48fdd82b9ee4456ad848b3b968975106dfc5e2a5deec500100000000ffffffff001e6c773a903300a30a4e0a7c87f930dfda7b66d23a6b2f473003fd0f7ef17a0000000000ffffffff0658020000000000001600146738606166ef7a554ccdc4bcbbfeed84e4c353a52202000000000000160014d5216b4f7929210c4fad73ca8dd875d28c256ca30a6c020000000000225120d0f967a3c386b82a8def77fd76de937b1bc6027e68b48377f0e778e67376f130cabd010000000000160014d5216b4f7929210c4fad73ca8dd875d28c256ca32c010000000000001600146738606166ef7a554ccdc4bcbbfeed84e4c353a52c010000000000001600146738606166ef7a554ccdc4bcbbfeed84e4c353a50248304502210093c60a9abc1e238706baff05d550bb893aa5c8d6d796d4e8e7ef707df058f22002204d415d1ab83b0ebd2e4cf96e36beb7d6923671846b6fd385049f633b7bf4b5710121037a36f3c3e7fad9ae942d6c8b50697de226fc7c6f12b1c0c057304fb9f107981202483045022100871cb6c48cb76816b3bc76759c22c61db1193edf17437fcd41e15deb6992806602200f6bd0afb7bb777b79d7dc14072b1774b5b56c5d2b63da75d18855b2887e49070121037a36f3c3e7fad9ae942d6c8b50697de226fc7c6f12b1c0c057304fb9f107981201418ab6e703323975bc52df309abbe9d01934d1e8b7a335aefb1b653feca3338ccdace93a4739b344d1a44870e4925e2af0605c44b1ee5c19b4700b162e0478a2f983024830450221009a9f0318d74693ca06b96a6835f18a46baa6a1ada72e5c74088c30d520d5765d0220552e752b575d23f918248c4ad1f8d3d6620fdd4bafaecbbc1160f638b68852f2012102c7915b74ba18202b67dda3cad3c010ef060bf5c99eecbe6eb81d601477b063680247304402204a7a2b19d6f90cdf8c6576baa397af605b5dbf5a7f259053fbb3f5cab71c8a580220089f0987ca3550dba416052308b9fbf6d3fafd1c99250f65de688bd4ea7db31f012102c7915b74ba18202b67dda3cad3c010ef060bf5c99eecbe6eb81d601477b0636802483045022100a52727fd901d5e7ef157c87ab2ed6430c7bd8b2901fc91a1fc1afedcf94573290220767ab397c1518fb45a332c66283433ad2935c3ad055c2afe01e3b7c6939252110121037a36f3c3e7fad9ae942d6c8b50697de226fc7c6f12b1c0c057304fb9f107981200000000',
    //         from: '0x5120d0f967a3c386b82a8def77fd76de937b1bc6027e68b48377f0e778e67376f130',
    //         'from-bal': '0n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'zbit',
    //         to: '0x0014d5216b4f7929210c4fad73ca8dd875d28c256ca3',
    //         'to-bal': '87399000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x006001201bce84be8be3a4f83a587fed2800e2da163fa93bf43803000000000000000000a72a2a9b00994d7f0760cb7097e042482e3f6472b058772e8f77bc1bad719e8bed050e657fed0417b5ca3e0a',
    //         height: '808891n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x6c943352d733416542ca95eddfade801fb241387d37d61c0237dae57daa27cee',
    //           '0x1d2f078b4775095a1b8021d30a8ba574d6439846f0549950d57dfaa62a4dfa7a',
    //           '0x05bcd547b23f6805a7c97fda87888149d0ffdd69b2636b50c8b9df528c26a9f3',
    //           '0x01e369e103b46d1b5e8cb89cf02ddf2feac5e9564f8134bef85e068e18ae1045',
    //           '0x2738dbfa1e7d3236de51c2c6a6c37c99635ab5231a965b6f547accab74ed7ec7',
    //           '0x5ccae3a3e0517049f3579e20f3734cc575221168eb957f53a0feff0eea0b74aa',
    //           '0xc4dcd4c0651342442eb0a19e18f0c2167bf5b40c386fb65edaa79ec2d673f652',
    //           '0xf2dd6bd8d9e687125c13523165b547f5cc7a1231922e934c76eef21499932e26',
    //           '0xd681e2d51753970efe0c9620926bed0ea3f5ad32e1930673c070db4e656424ef',
    //           '0xac76e1759a44a16ade4e87a3c2be4a8bc03f517a285ae1ad9101ee6c944b5f60',
    //           '0xf24ea2870d33d905c148f8214246573d2bc818c4af5c8a6fed717a3ef9709718',
    //           '0xd46634e4d1158efe8f2faa927ec646285fdb00a9705bc847dfdd86b614b97546',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '956n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xddd6e920aa44cdd212410378dd960cae42a5a324023882bb799b05a271f02c360bb4d3f241f3ff6d23c86a4d00a66e8ac1f8a44f6c56b0dce175dedf3418961100',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x4998700c1ff956e4cc0800f08432a86853fefb587b28db9ed6a64feb2ef50330',
    //         },
    //       ],
    //       tx: {
    //         amt: '1556000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000106f075550c3a92bf81fc74f2ebd7661fa43d57e643e3a4f64b4b25fd8516bf8ea90400000000fffffffff075550c3a92bf81fc74f2ebd7661fa43d57e643e3a4f64b4b25fd8516bf8ea90500000000ffffffff0110e2ce37b5f7351d29b6364dc97e9143c028389662fe5f6046099f55e2889d0000000000ffffffff337f2bbfa2de20ed5f89bd3968a767eac0be35fce4bca44e85d9407cc7cc47230300000000fffffffffe07109058bbb18785de94c485e6244d06d2d52c9e08ec89d085de00add878be0300000000fffffffff075550c3a92bf81fc74f2ebd7661fa43d57e643e3a4f64b4b25fd8516bf8ea90000000000ffffffff065802000000000000160014f0e3042dd822944280c93cb7b10c3857455812572202000000000000160014d5216b4f7929210c4fad73ca8dd875d28c256ca3f052030000000000225120fd21f5311df8333abf310d3587df51f994fd346c2abe40d7a800b545ef3fb09bd30a000000000000160014d5216b4f7929210c4fad73ca8dd875d28c256ca32c01000000000000160014f0e3042dd822944280c93cb7b10c3857455812572c01000000000000160014f0e3042dd822944280c93cb7b10c385745581257024830450221008a1fee8e67b951e459cf355fd92b8570c4fb0ddf9c76d4730160ac70d93576590220538254ae257dcf5176430beef8aca54e0c058b515649906123b255573682ef6e012102ad63da1b472f38959ef5b1d2c4b57a7860885944330f1385ae6b4a1c82e7451102483045022100859b954a9168fadb0ea920a5eb188c86b6e2ced0fd082095e08209a85544713902206daff98073f4e8013981590e0ac6f3508ca12144b68bb9bf3c8fbd47e7869322012102ad63da1b472f38959ef5b1d2c4b57a7860885944330f1385ae6b4a1c82e745110141fd07fc5ad6c8fc84eb026b343d9decd54102a3fc97ff1313478f819dfae8e16b742cd08d56349a75a42ac82d4e1d8200561afe6e85107b83cc1b1b1c971e03e58302483045022100a442be1063b2b63fcd0385a0878133116a8d9d5a38cc3ff682bfcb3b142cac970220390bf7ecda96c26f726075070f573f52bdb38147b782064025bad633480a6d05012102c7915b74ba18202b67dda3cad3c010ef060bf5c99eecbe6eb81d601477b0636802483045022100b9117b625056f7ca78d41faf3e8bc13918fb6fa53d46fc11daf12702e3af3a5a02202a003f758baad527ba598e82b5c350d53957c97280a71b795e9d8212b15302c9012102c7915b74ba18202b67dda3cad3c010ef060bf5c99eecbe6eb81d601477b0636802483045022100863bbf3f58356283607cdb8cb409d949ad4eb5415f51ffe2e8ad0b78c499a2cd022044f1b09f1f49ba65b788cd1040e91173537bde0b2b3a89deabed45caa8fe572e012102ad63da1b472f38959ef5b1d2c4b57a7860885944330f1385ae6b4a1c82e7451100000000',
    //         from: '0x5120fd21f5311df8333abf310d3587df51f994fd346c2abe40d7a800b545ef3fb09b',
    //         'from-bal': '0n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'zbit',
    //         to: '0x0014d5216b4f7929210c4fad73ca8dd875d28c256ca3',
    //         'to-bal': '87399000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x006001201bce84be8be3a4f83a587fed2800e2da163fa93bf43803000000000000000000a72a2a9b00994d7f0760cb7097e042482e3f6472b058772e8f77bc1bad719e8bed050e657fed0417b5ca3e0a',
    //         height: '808891n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x4f91a5f0fd5ee3c0eeb58a53029ee7f0ec3386d3d4a7bcdb6ca078fa0e5c75ea',
    //           '0x1d2f078b4775095a1b8021d30a8ba574d6439846f0549950d57dfaa62a4dfa7a',
    //           '0x05bcd547b23f6805a7c97fda87888149d0ffdd69b2636b50c8b9df528c26a9f3',
    //           '0x01e369e103b46d1b5e8cb89cf02ddf2feac5e9564f8134bef85e068e18ae1045',
    //           '0x2738dbfa1e7d3236de51c2c6a6c37c99635ab5231a965b6f547accab74ed7ec7',
    //           '0x5ccae3a3e0517049f3579e20f3734cc575221168eb957f53a0feff0eea0b74aa',
    //           '0xc4dcd4c0651342442eb0a19e18f0c2167bf5b40c386fb65edaa79ec2d673f652',
    //           '0xf2dd6bd8d9e687125c13523165b547f5cc7a1231922e934c76eef21499932e26',
    //           '0xd681e2d51753970efe0c9620926bed0ea3f5ad32e1930673c070db4e656424ef',
    //           '0xac76e1759a44a16ade4e87a3c2be4a8bc03f517a285ae1ad9101ee6c944b5f60',
    //           '0xf24ea2870d33d905c148f8214246573d2bc818c4af5c8a6fed717a3ef9709718',
    //           '0xd46634e4d1158efe8f2faa927ec646285fdb00a9705bc847dfdd86b614b97546',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '957n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x398a9fd6acc81ee9ee2d6fff13844f41a6d62ed8a4103eeb64716186cb84eebb491b78c4beea2925dc6c2c23b7f8f4456adb86c7ccbf27b629f6b4cd494ea30601',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x48c197d0bf2ea52b67d4457f43dd1e1c888053f13cc290b0698eaf72b5983d85',
    //         },
    //       ],
    //       tx: {
    //         amt: '35000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000105b0238df36b29c51ffebefa29ac1c78e5d18d14d65efd59ecee1452e9b1265a4a0400000000ffffffffb0238df36b29c51ffebefa29ac1c78e5d18d14d65efd59ecee1452e9b1265a4a0500000000ffffffffda2ee306d8f510fe68f0fd176916fcca1689b369fdc155758a664ebcc976367c0000000000ffffffffde685cbf7906b8ec16992add6a5f82ff0082e1c2980a634a7c97f15a8ac02f590000000000ffffffffb0238df36b29c51ffebefa29ac1c78e5d18d14d65efd59ecee1452e9b1265a4a0000000000ffffffff075802000000000000160014c7af7f5eade665c8114ac17b637e78a3cdbd25c22202000000000000160014116eaa887f7de958ee012cef1e84ead79bdca9bae00f1a000000000017a9141f87ee61f0a3dba962a10d8c45e3661201ca65bf876035000000000000160014575f3a9c9ba1b0937b3e22373c9925eebef655403bd6000000000000160014116eaa887f7de958ee012cef1e84ead79bdca9ba2c01000000000000160014c7af7f5eade665c8114ac17b637e78a3cdbd25c22c01000000000000160014c7af7f5eade665c8114ac17b637e78a3cdbd25c20248304502210093c14ec969296a6a7c68414b6daf582aeab84b3bca061ff85f51621e69d0fdaa0220431c00cccb4155baf4284296f9e4dba54ea247577044bd76138431f1a395c14a01210218a4d5fc3b61d654308cb36bc205b631411273a632a905714765cb2a991136b702473044022063495fd7dbcd404c966a3c2dafe9dc9eb859c08413337be8707e758bd2c7bfb102203a9dbcfc78e97c41d7841d246a922421f3bdcb779058a4bdcbda0c79528d6f2601210218a4d5fc3b61d654308cb36bc205b631411273a632a905714765cb2a991136b70141661891168da46ef0880aff54752b1b0932fef0bc3635acb89eba38c3e40ec401131053c69b3a791b8fe1f02b1b0b8546fec9139ea061d952c6f67e6e394d8c46830247304402205230dc6287a2015896e57419b0e676e4e5afc7198a2da750be0361a80d8ae275022064847202835c8f228a45a9fc5a08ede895091d002f13d411652366b125481530012103032530262af84deb423decc0e0439ac1a89544649c3c31c6552d8230b9ecebf60247304402205b55162c6d8b8e8ebd7883c922c52c2993b80a2c53cbe6ab65e9db1193453526022062181ceea5e937321854fd5e05b9c1a8d68747ef54c0bb5ff82f92f220df373001210218a4d5fc3b61d654308cb36bc205b631411273a632a905714765cb2a991136b700000000',
    //         from: '0x512054ff58ea983b2bfb29f1d52bce802fac8810fd63083426bde6001ab287e0020a',
    //         'from-bal': '960000000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x0014116eaa887f7de958ee012cef1e84ead79bdca9ba',
    //         'to-bal': '140000000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00a0b4266d8c1455ac74f5fe835d0aad87317fd600665c4cb8da00000000000000000000da309555e596905b182154a72cc51733f1fa604240b101ad1ed751e28ece2645f40a0e657fed04176588c553',
    //         height: '808892n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x1fcb68d9e1191b39679927444c7e5dcfe96e099ada31d59189be26a802e7e51e',
    //           '0x195660ce9121130beebdaf70ffc39202e3e68a0b1cfb70fa683ea7de845ca14f',
    //           '0x2b1ef2fc048b4e8044be9e4101dbaa8677bf125d58669779656f624bce836375',
    //           '0x2757912724300843a3134199c540d4a59d684ad415d867aace8e85ad254c5275',
    //           '0x154e2a76aefcc408784cee436e24605948c3051a91e46b2dd4fe26225eedcd3c',
    //           '0x72555d2857788705521656260e2a965e80d59644feff8e507230d8482436618b',
    //           '0x0872d812687539855716fa51f1627c9313d0c47b0a0c8da46438a0bb0cf941c2',
    //           '0x103b1b74c8f152c5dc2197202bf81b9b06b03510cfb2d7640a4642c7cb423606',
    //           '0x1f9947c795ccbdac39d5f916e949e12e203b283d2e7ecaf8e12c8b208d7c7873',
    //           '0xe2dad05cb4392ca7dc3c3278d07924580dcef4e586bf68493ae0a9b019102ae0',
    //           '0x469ed428219af3f0f5fd0d51c0dade56074d7066074d93ff30c989e60566959d',
    //           '0x747333af33c013d33bbd8583ca45bc338a08eaf50d6ade6a45436f3467d1d5b7',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '2918n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xb5387190a66ec9a4f287ceb2a701007a2bbb117b08d3e4078a0d1f194f28ff801e9257ab3bffa565276ae0bc9e79af61bcc8251da6681292ec09bd5c2bfa515100',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x13eee09667b7b3776a48de46b0e4d5c59ceeeb48db8df713b4e3479cb645d816',
    //         },
    //       ],
    //       tx: {
    //         amt: '1000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000105e7f70e29c11b6d46084a23eae9cbf3958a57abb3eefdb6b29d8d382825adc01e0000000000ffffffff228459d6187d864e8264b469e90010efa9c943dcec9e4ce44fab643cd18497290000000000ffffffff476eee4d162ed415d22b86543eecb30871d13460cce80145f501c7986b23b0aa0000000000ffffffff6f9ea25ad3557e9b5d9a99f7644700dc29561077288a761580f33634068fe2370100000000ffffffffcc0a4477cac70b404da892ec737b40e7b1724fffbfbc999204d230cb109aa8630200000000ffffffff07b00400000000000016001492ec20531e603ea1b4c0093815aa9aa7097cca56220200000000000016001492ec20531e603ea1b4c0093815aa9aa7097cca56ca5d010000000000225120ff9f0855a0ef4d58102fb645fa47b6db45ad916adac4b82b1cd8a1f2e403487d4402000000000000160014c015c65276d5f38d599d445c4cb03aa7aa0dc365580200000000000016001492ec20531e603ea1b4c0093815aa9aa7097cca56580200000000000016001492ec20531e603ea1b4c0093815aa9aa7097cca565f2d00000000000016001492ec20531e603ea1b4c0093815aa9aa7097cca560247304402202a9602cae82eb0bde69973d20b975eb81a6200e297c4f5bbb0492fb563d4bbc602201b032d94cf3f7781866649b430d87ab52e94422ef71f49f80ed6c450a5c0bd16012103589cb22f27b758b7404375310674b0a234aec8d3fbddece9da0c5f43272071cf02473044022019af01eeadb28d864d48b8de11c0b1665af5903550b646ec49d3463b4db3533c022014ae95b537a765c8494fb599ff0da021588a7ff308b38fa8249872a79692311a012103589cb22f27b758b7404375310674b0a234aec8d3fbddece9da0c5f43272071cf01412733de6f31e127ab8826d371a2c11868adcc48457f59fd03ec2195aa7bf6d4d009dcf03f046cdb99aa5e79d82cb02d22f587e7dbd8e8ff29433fc33a2e7d08ef8302483045022100c7a043096d015d0ab6eb98dfcf1b70678027a5f1cf0051ddf8e423cb147bd8030220105c22d2ba29911026484e810d51793a8914da77f999997ed453f916c13f430c012103589cb22f27b758b7404375310674b0a234aec8d3fbddece9da0c5f43272071cf02483045022100b550028c05e997c63cbe0f013ec5fa783220c6a7aed457d8f5f34ea5f152e71c02206407ddb4ba8feb913e104a2de048e029ad833e5b96b178d0d2386908b0ae5717012103589cb22f27b758b7404375310674b0a234aec8d3fbddece9da0c5f43272071cf00000000',
    //         from: '0x5120ff9f0855a0ef4d58102fb645fa47b6db45ad916adac4b82b1cd8a1f2e403487d',
    //         'from-bal': '10000000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x001492ec20531e603ea1b4c0093815aa9aa7097cca56',
    //         'to-bal': '1100000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00407f22348faaa9e968262aa9b1a985f98aed82766ba85d298200000000000000000000a259d1927176781cc9b5504110f8ea875c6b957a17d11d24c1679ab80d865bbac9240e657fed04173b56d525',
    //         height: '808904n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x33cb5a613b0f10ab0b1e50aa046cceb9bbe7fff73d6a738ab08bc514412cfe45',
    //           '0xaf44ccb090ee76512fbe8a4329c4dc7a4f2b4433565cc9e9aff817da19a97b4b',
    //           '0x74095e7947686a7aeb870c978c92a82bfb24321afbe5c3e90dc457cd19bb6ccc',
    //           '0xa89d5635f351f17a95efd20c59cba0cfe419a82b85294c3f391665e3795c028a',
    //           '0x1db31b00b1973aa962f5a621e09e4ada38230e74f9c98a05a2b85d818f0a169e',
    //           '0xdb0941320ad0956367e6ec950319a889c69fed2cead2519aa7d7ee8da0e0e154',
    //           '0x9d19b14487dd8cfbd2a6ceb033cabef40b8f1a95232faa8b789a7f7cacb3db7c',
    //           '0x005231e10ae18a3af796769a505a507bab92b21ffb4baa603ea8b8d53c8bfa6b',
    //           '0x043b499daeaaba8c02149dae2d23ab5759a4e91ffab112836a5f6340a09aec35',
    //           '0x79f7b6bc857feff4cff8a043feabdbfc0617b544b1a0ede27f5d8fb984c4eba3',
    //           '0x39c1ef52efdb86be808444e5740e3b230ac7e89fbd4ededec4eeb7eb9687f77e',
    //           '0xed3415cc292b9462f16d6419eecea773d91a7d334a12c6ab550af5017c6447c4',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '1049n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xe76159d7d14790161b826a746ee5940b7268fa9eb2330ba69e91796268d827b454aea20e2c50765f9f8a9804b3dc113e7af754bcd4ac19779b23903a5f266dba01',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0xdc258632b9dfa0159feec986e0a917b24c79e55c3379919b6454ecf405eecae1',
    //         },
    //       ],
    //       tx: {
    //         amt: '10000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001023ecf42aeb5f7a0c679e3dae3be9a8009c74bb545b7fe3aa8e851e688b8a8e1f70000000000ffffffffabbf1664544715b5a7ca18756e3fd079ecba21b521d41c17b983d92994d3493a01000000171600144c79e6f2e9743279cbf07784d7f483541c9458e0ffffffff022202000000000000225120c068328b7fdfd1e01b0b25130778b74e92543b19c820b6243267674b1127b850bd9802000000000017a91456e3eecef4a675e97c36f387835c3a7a32c8d974870140e5a91d8c0f43eefcbef4fab96da56986031c993999b66ab213a77ef139885a854cd620239aee15319f39d3147b24875d2d48373d0b84b06dca455ebbfc754f480248304502210083d56e2a58efcfb868d4a423a71afa8858845fc27a63685d01ef87454aae99ad02201cb2db44e68bf63b6a74904fefdab487de481f40e7fced5cb3476e873941ceaf012103edd18d6b1697f6ee77b78cd18fc41cfa14ea2578e6ffc65f4437ac3a1b58050a00000000',
    //         from: '0x5120c068328b7fdfd1e01b0b25130778b74e92543b19c820b6243267674b1127b850',
    //         'from-bal': '72000000000000000000000n',
    //         offset: '0n',
    //         output: '0n',
    //         tick: 'oxbt',
    //         to: '0x5120c068328b7fdfd1e01b0b25130778b74e92543b19c820b6243267674b1127b850',
    //         'to-bal': '72000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0ff3f65c84ef5c94dfe79de9d06d5351e0f1715f489a114ab00000000000000000000c6cc3eff886b2b91e2310485004f4289f5853b9266d07e1f8c75f9a1bdf24af2580b0e657fed0417730d6408',
    //         height: '808893n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x582edd10b80b483a6383b3a89caeb015499233e19ed3a7d529c9b169fb7ccd26',
    //           '0xfef86d75832d5c7b56f8914f48c4c9c3c527f6fb2c53ee80d774662b550c5fcc',
    //           '0x768c6737a11b1827761c4ffb2cd17cf66212dcdcb0c50783704886e619357296',
    //           '0x5fba8fab86e92b30803588c1ba7b44e8f93bac924ad32669cf89af2692e9823f',
    //           '0x9bd7a231ed7adc36fff7430c526a88955a0d456e22fa82fcc027f6f75fe62716',
    //           '0xb93e33f485ed203a5b25de4dc2874e2fba402dd146afce593b884f0bf85da3a2',
    //           '0x0d00b274a64a29928d7c4c390d8db00976b9ec8331605045c3293f5f2d4022e2',
    //           '0x4d71b8ac56633293a86fff93718b7c750c4e8b95e0730d167a5882100c973545',
    //           '0xcfb93d647e9a718df25cc6b05426c15b379d76b2735db2e2722ef6f01b2f115a',
    //           '0x9e2ae8ab3c7fb9abff6924ab529fedea847bf296653a8bf9fe178dea9eae1922',
    //         ],
    //         'tree-depth': '10n',
    //         'tx-index': '101n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x6a83b8edcb6471b97d52e9256006f9654f5aed2df48d5416396141951458845a334b838e17d68d68423c5e39ffa8db53cc5eb9cb6a1d2b63ec4f53fcc589574900',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0xcc371f24eab325d72896f9e6620a15d3b68e32afd4054a7d4ce5421a69db294a',
    //         },
    //       ],
    //       tx: {
    //         amt: '599999974000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001066c8e9d3ff6611423beff8c7873075a08fb5feaae3000a44907082b2c931a19b40400000000ffffffff6c8e9d3ff6611423beff8c7873075a08fb5feaae3000a44907082b2c931a19b40500000000ffffffff3f935d672b8e67542ebbb0e3aa6318f0cdea57edbc6b220e38e4e1ddcaf9a19c0000000000ffffffff66030aa31f5812ca7f2edbd4606fe1af7b6586c420170b11c8a231c51f8fc4df0200000000ffffffff04e5ac3504df0e2b8859fa40d95d7754d4d8c347c26e5711c8138e05319060970200000000ffffffff6c8e9d3ff6611423beff8c7873075a08fb5feaae3000a44907082b2c931a19b40000000000ffffffff0658020000000000001600146cb94a57e280f4b204189fff894aee058791322d220200000000000022512045026cd75432fa2919f278ccdfb0badadf482314fed37910500a9d9a46e3d9910b8a000000000000225120794a6fdd872c2c1cd83c96f5d159f787d85568d63e8852d1de94f1fc3c60af111b1b1e000000000022512045026cd75432fa2919f278ccdfb0badadf482314fed37910500a9d9a46e3d9912c010000000000001600146cb94a57e280f4b204189fff894aee058791322d2c010000000000001600146cb94a57e280f4b204189fff894aee058791322d024830450221008ec4c7189150271b3959f2447c12ca2272af2f41138f7093f0b9ebc487b2703202205347b479505c00f2ac727307d614aab0bbc0220a0f041fe58a8ca8787c6115da012102ca6b1d241a85f46cb649e3f7c0dae925ecf09f751125089d25475ffd62fec7e302473044022017c846adac2899d31cf0d45a8456d8f4dbff4b15b80f89d218d2f2ff06e9129602206849a4d6cd0b1ffffa3c23c0166a7b7422afbfd8acf0bb6f2ac82dfaf968dadf012102ca6b1d241a85f46cb649e3f7c0dae925ecf09f751125089d25475ffd62fec7e301414ad645bd02b9f115ebb9eaeb160710d55c1b05ae78b6336fd792bcde58f2ef280c5877c54c744fd93caa6bea8da88ae11a113daa11e6b1dbfddfca4f1fbe01528301405a5d2fa552cead30c29ee3cf7329703cc14cf8664b649c8a8b71662b190201c18b450d0ff67706554a21875592e0ea031abb7a669dcc69905d5e0039f61d39b701400bf13002a81298f6be95979975643615f3ab58eb928efd16899ebdd639f16bbdd933a294c3f5cea024255ddd7ebbf1b384f6f79f27c66f1e7cdb0655c78daf8b0248304502210099f1c2d3505d20893d41bda54a99a16ea2b4062df6dc5c00ef3e308e5327d5120220567b16c5b08bf8f81e054e72f148e9a335cd5dbe228cb9ce2cc8e21022f0011f012102ca6b1d241a85f46cb649e3f7c0dae925ecf09f751125089d25475ffd62fec7e300000000',
    //         from: '0x5120794a6fdd872c2c1cd83c96f5d159f787d85568d63e8852d1de94f1fc3c60af11',
    //         'from-bal': '287099999698000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x512045026cd75432fa2919f278ccdfb0badadf482314fed37910500a9d9a46e3d991',
    //         'to-bal': '7399999974000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0ff3f65c84ef5c94dfe79de9d06d5351e0f1715f489a114ab00000000000000000000c6cc3eff886b2b91e2310485004f4289f5853b9266d07e1f8c75f9a1bdf24af2580b0e657fed0417730d6408',
    //         height: '808893n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x429325eb5169a6f6a7ac714da0d2cd2559a3244a6826bf1085038ebf3dbdeaeb',
    //           '0x9ac97d35b471bd3ba12125035bca3f88d6dc1c3fb994b7076d7812df79b603a5',
    //           '0xe41fbf6214e7d9a8bd33493f8d9865b32aff2a2223009a077e45a335a175797d',
    //           '0xc5b12e153ad3082b19cd5ec7c25b31e45e8147a19f6b37909fd19748756494d4',
    //           '0xbec477a4576552262ae3611cf36a7439edcd53adff45ebd7866b661096af1ed2',
    //           '0x64e728035b7e93509e15b472c48867cef849ad1569b322adad4bad193fde80bb',
    //           '0x2058f654b432997356dfe8c2c68798bb0c0a33c5a977fca727f82b256604d18f',
    //           '0xe0d3e7ead0d1c3d2fe62d9a4dfb010511d244b088d7f81e1613fcaf98ea0a55c',
    //           '0x3bc84236dcc6e4315b6ace40ea278f6b5f3616fdb86c9cd457410cd1e59d9f62',
    //           '0x9e2ae8ab3c7fb9abff6924ab529fedea847bf296653a8bf9fe178dea9eae1922',
    //         ],
    //         'tree-depth': '10n',
    //         'tx-index': '380n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x28c6cc386bd761ae05874d98c1ffb0cd6d0dc5145b5db72551bda35340cddf856eeb3b203317a7676a4c73744e14ea66839d2990c9f7a2ae9387be3b0a1c700b01',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x0f930b5662a99d89e07c6137d00e53ad29894bcf7542c802861e32d9fbd17e4b',
    //         },
    //       ],
    //       tx: {
    //         amt: '100000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001023c6e27c2fec718c6147d97ffa928d2e2e9b2ba20bf40aabb77f1bc6b0bb133a10000000000ffffffff2fe701f44f1ab1373e0b558355f21ca8b59f3086b725aeba9e5309c42e6a85bc0000000000ffffffff02220200000000000016001411247749f87230f0893898811341c139e7c81beac15200000000000016001411247749f87230f0893898811341c139e7c81bea02483045022100e20ad91e23eca936e0ed9db61a6bdd37454c5e9113154369266c72768922eafc02206b5386db3371bdab15fdaec5d98754e7173d53ee512fe8d006f3c14fb97ec08e012103b5fc777149a5919277e7babbb3a0611bd2c16bd6de77f3ba1ecaa7471430bc2b0247304402202334e0abfc4bbc5ee9d21a5f2de62e5bfedd4cc88bc07c94121d5e029ecd35fb022041c433a5565e90b239061099dff8309fd7376fc64c7f4ce626806299cb6067cc012103b5fc777149a5919277e7babbb3a0611bd2c16bd6de77f3ba1ecaa7471430bc2b00000000',
    //         from: '0x001411247749f87230f0893898811341c139e7c81bea',
    //         'from-bal': '100000000000000000000000000n',
    //         offset: '0n',
    //         output: '0n',
    //         tick: 'sats',
    //         to: '0x001411247749f87230f0893898811341c139e7c81bea',
    //         'to-bal': '100000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xfc1a8a32a0cfd17703ae6fdcdde767ab728a41dc387154320d24a64c01f40213',
    //           '0x4085e43e49c472848dd6fee940c0d2552d2ae2aaee66179be914d56de3679893',
    //           '0x8e15f1503bdaece1369e2f7b89d1b9802bba65a8f26d06a96e605ccaa695081e',
    //           '0xddcaade155bc49a3f9c7be82c6fa95f3af7596f0d24bc8c810e4e0539416487e',
    //           '0x469af5f5bd108285e1f9cc2497f56b1827771dab4263230cd9825ba12ecf1a53',
    //           '0x5f99b1a268cff55341a046ee13a10e345b6babbdb75331e38bb2b2393078d55b',
    //           '0xa399b2876feeaa65c33e9dccc9e3d8e39651e5252b6fb4084e874b0221918c13',
    //           '0x06d647b9e075f6bc91e08a8f947368c1f5a74ab23e1e549b511348d48ce43f5c',
    //           '0x23ee801f52bb00c788a7b856a772d78ad8fd06698ea8d5602ff2a5a901966b9b',
    //           '0x26705ddc3f29a4b8a35607d92549e34f9e6ca83e885cb1026fce6a2871b78e44',
    //           '0x62061ca47001f9c2f5b6b16d89bdf84d7fe11f483d877512b2dab0fc251f63e8',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '431n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xe7658993549f9518b305f5efe3301123c42beb82080eb439fc35384301192ed67f4a0cb5aa84afb153dcef5522f26fa30584171cec3d874e3f9db8eb9995f2df01',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0xa0338d862e2f5552134595887c2d8b2adb1a2c058a09ebf122385c661013ef0e',
    //         },
    //       ],
    //       tx: {
    //         amt: '3000000002000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000107cae4f0e9d0c18339626bf8616004d9e6e96def09bb878471581e9d91163432fd0500000000ffffffff07398287bc792e730ccedcd32d420a51ed5b579aee2da0c197b10b13901dfc3a0400000000ffffffff3c01207a12762f541bff8e0021a59f23bf07332202b20c97feaef309610860220000000000ffffffffa183953601a21999a1aba279aae0201278ed2311053e396ca64a7bad5772151c0200000000ffffffff67a30bff6bb62b35f78205b85c4dddf0f4ef2fad53733e214393a3f8d7b891160100000000ffffffffe5d1fcd68766b5a103a44de4e3ed2096868d4c0218881535b9fe7c553326efb80100000000fffffffffc5587882b1cbb4ddd8e18a0b90aea2f768ccb2b74d0018d92a17c9a4f4d5d2a0200000000ffffffff07b004000000000000225120bb58204b119b86911c9583184239669c06a0f2ff1c4a1b1a9520d47db6b93d4d2202000000000000225120bb58204b119b86911c9583184239669c06a0f2ff1c4a1b1a9520d47db6b93d4d4b8a040000000000160014efddede7975ee3a4f6470de780c59bf5c95e36984402000000000000160014c015c65276d5f38d599d445c4cb03aa7aa0dc3655802000000000000225120bb58204b119b86911c9583184239669c06a0f2ff1c4a1b1a9520d47db6b93d4d5802000000000000225120bb58204b119b86911c9583184239669c06a0f2ff1c4a1b1a9520d47db6b93d4d9943000000000000225120bb58204b119b86911c9583184239669c06a0f2ff1c4a1b1a9520d47db6b93d4d0140772e22caa7c3e8cce2632ca2c58b5dbf52ab6c5e0ef1d21b0885353248f5e96cbb056fce6f64f6420179bff47b601334517571f1e95f9e2bb0fb14f331f70dda01409851436675fc2008fa3caf960ea31a21ad424954fed771eac34b0392fe84845b5695edeb886c88d8d6f0f5b1fa42a93a1ecef31dc1981e18ff8eaf4cba56870102483045022100d2c4a31a895881df9eabce5fe620e6f93f51fdf8a18b96e56054149996f5e52c0220238fcbabc6972388c0ae21f2e034546a230e7d0c351617c31c1e2a35f0855cb98321039015b03efe0c27f644ae757f42fd1ab3d872f3492ee5a7a490921f7e7f0302e10140bf88f09227bc0299170632fe06b700adbdf75acb03bc372ff82b8db8f22ab5bc732a5ae54537bc934df7790cf82b1e0f43d733e2d26a374e12aa16c7fa88487b01408e4e229e518be917d01199500f85e85265463867430c707dc719713776f56113e25ca4a737dc2da32518588c117aa334741ecf6e04f9c52d60fd02905280fca0014036fb600713fe0a00678c0c404e03fc5ba2ec2bf3904069749b3073cc098afc7d978d382b7f57c15921fa91fbad54594b1235ec6002b49ed38acb57cbc2f6e06f0140e38bfb0754715aaeb0f5352ea5f41a80d5566666f52e9ace4843fcdb84b1d8580efb668598e0accee79a6ecdce81611aeffba27d26cae9522c9e5b527011223600000000',
    //         from: '0x0014efddede7975ee3a4f6470de780c59bf5c95e3698',
    //         'from-bal': '26999999998000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120bb58204b119b86911c9583184239669c06a0f2ff1c4a1b1a9520d47db6b93d4d',
    //         'to-bal': '3000000002000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xaa092e2dc56bd786d5cbbd40f7261da5065d24cef11bc451279582a05732ac08',
    //           '0x6e71235f46bed776315f12179a678be49042ef9ca666fa34e97cc6b0ea3065ec',
    //           '0xed1fabca8a9cddb73d2877280087f3c5e36482b8fbb15fd628587416c801e3a5',
    //           '0xd2b021f5312cf7e668aa5f2e26f0b1d71d1bfcf52fb8eed3d971c6c3a0f1a989',
    //           '0x3f4f94ceb937f8bbaef66b58fe11bc7dfb63d4b12a6f4d90cb1ad7b8e53c173c',
    //           '0xb3bb17a81e7f39ee59f40d3355cbc850a9a323e85cbae00d177ed22fdc65e2d1',
    //           '0x1609b4c3885a572bc5ed6e6b5e376d39808111fadb7ec3d22b959cc5dec8cfe7',
    //           '0x06d647b9e075f6bc91e08a8f947368c1f5a74ab23e1e549b511348d48ce43f5c',
    //           '0x23ee801f52bb00c788a7b856a772d78ad8fd06698ea8d5602ff2a5a901966b9b',
    //           '0x26705ddc3f29a4b8a35607d92549e34f9e6ca83e885cb1026fce6a2871b78e44',
    //           '0x62061ca47001f9c2f5b6b16d89bdf84d7fe11f483d877512b2dab0fc251f63e8',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '501n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xb8eac5cb26de2f4cb7eef5b6d6ae3aa5b2ee635edcf697fc198f3c53c89446963c6f16b25b5cb0a5edd76c4bbb6ea76f956c1ff7931711aee199e21159956f3b00',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0xec7c70bb23bc8a45f9be99c7f32850a1e441de5f0d3fa65ded132229e5a4fb4f',
    //         },
    //       ],
    //       tx: {
    //         amt: '100000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001063047d5ca4fa1ab915e537c74011b9eeb6ffed808884b393f8a57bdd6e8e124d90500000000ffffffff3047d5ca4fa1ab915e537c74011b9eeb6ffed808884b393f8a57bdd6e8e124d90600000000ffffffff3ba65e6a6cdc92451ae9656ee07082d98fa1a176001fd73556dfe8003b1eea380000000000ffffffffb149fc1673a2dd4012d68180611df0d35e93c801c98085eabc687401c2413af80200000017160014c93b696e5d4a8803985efb9c008c585f2ca0fa31ffffffff2b68908234ac2f85ba2e52d515120a5225f6262bf8e15600e913cff60ba6c5d40600000017160014c93b696e5d4a8803985efb9c008c585f2ca0fa31ffffffff3047d5ca4fa1ab915e537c74011b9eeb6ffed808884b393f8a57bdd6e8e124d90000000000ffffffff0758020000000000001600140628cffb06c858988f5c5b77d0a5f69540f61c4e2202000000000000225120741c2f1e7b5765a7962749cd41dce28369b9f8b68530e6fcff6c09ba1fe5f9d210f4460000000000225120cf6990d714ee03db4982e43b1230b9603efcb4c7b7dadbe358b3136739f1ba005091000000000000160014c3a8b47eb669635243c73314d38db7c03881507f7e4730000000000017a914e2038779da5d489b53526e58dd3b70fd5bcdab20872c010000000000001600140628cffb06c858988f5c5b77d0a5f69540f61c4e2c010000000000001600140628cffb06c858988f5c5b77d0a5f69540f61c4e0247304402206933abb87828c36665ddf18db556cf9073a01aa08a27c60626e97145d17ed7a1022014f02357098932aaa6f94facd25424b43d838550070d175039a910aebddf3bb50121030de8eef3ccfa6137a93a9ed16b432d490cb6c098fa8a1514d3b6a0493bdd737202483045022100eda135eff98633d99b7026b0d8d343f53f2bc36651b4c1e8578c30f7e456b4610220044394e74c1c534ced48351d107da82a57d37bc093dffce1e66102778fb737a90121030de8eef3ccfa6137a93a9ed16b432d490cb6c098fa8a1514d3b6a0493bdd737201415c0c2870fe7c638739aec929e5a44137b0ca2ae8035589de214a9c6d06055684089d50efb33505c21afb130c49c1a3285b952a85a69a144a6cfd7ebccd1f2f95830247304402207477b1f4288dcc5a0b26665ff3ecc5ab9649f974cc451dc71b38f5106d4c09d202203094ffe15bcad90d0949e969d28e4e0796e92d8fa2d77a8e753aecbc9a78d71f012102526a66d4721a35e62ed2fd2d80aeb446c9483df3e14ad87cc3e42f69edae843f02483045022100de96432d1ec7a840decf63e5a9e04938937bd9245ebcbf35da51bacc0fd1fe7202206a330e7e0bf22b8acdffa271cb5423cd46956c3d89ab13200057e7cad9a821b5012102526a66d4721a35e62ed2fd2d80aeb446c9483df3e14ad87cc3e42f69edae843f024730440220029f578a89a49013d32e9ba9b0d5072689b2feba960805a9361fda6e437475d1022072a2a3b06c0a7d7ee80d0780848a9c3072327092d8f6298e6889b7eb7e3c0e6b0121030de8eef3ccfa6137a93a9ed16b432d490cb6c098fa8a1514d3b6a0493bdd737200000000',
    //         from: '0x5120cf6990d714ee03db4982e43b1230b9603efcb4c7b7dadbe358b3136739f1ba00',
    //         'from-bal': '1600000000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120741c2f1e7b5765a7962749cd41dce28369b9f8b68530e6fcff6c09ba1fe5f9d2',
    //         'to-bal': '150000000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x6da00b1fe56cc0018e06c53c9acecf857cb640dde28bd1149207a10f5343dd82',
    //           '0xcf8635d9b1bf67fb0b74b783e9f0ed7e021fa1ea4834ed121d36cfd7770ef34d',
    //           '0x51490d9df40c39665fb5e789256f11b21cbc07bf798ef59540c3cbe349b29b26',
    //           '0xe3ccc2192e2795a6b9e59ab6221fb60f9ad59bb3f0c2db72986e3a05e2f23672',
    //           '0x69fd177f9af1cad84f2666ccbf29aaf6326819746b9f9d1f1ade1d126c351d19',
    //           '0x68f11cd3af71108d912cea6efcdd7f4f879a14dfee1e571b7f4897971aaaa2b1',
    //           '0x1609b4c3885a572bc5ed6e6b5e376d39808111fadb7ec3d22b959cc5dec8cfe7',
    //           '0x06d647b9e075f6bc91e08a8f947368c1f5a74ab23e1e549b511348d48ce43f5c',
    //           '0x23ee801f52bb00c788a7b856a772d78ad8fd06698ea8d5602ff2a5a901966b9b',
    //           '0x26705ddc3f29a4b8a35607d92549e34f9e6ca83e885cb1026fce6a2871b78e44',
    //           '0x62061ca47001f9c2f5b6b16d89bdf84d7fe11f483d877512b2dab0fc251f63e8',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '452n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x2583f0e04fa20082c12edf2795cb0a495f0988bbf82d5357debc6126e9c9338c58b50fe9f3f0eec9c330c1e3f9615368a215a2f9f83638025f0e9719360211bf01',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0xc2dc851695d6188604fe4ef4e82850aaee4fa8dd008f43bf285b9157fc046711',
    //         },
    //       ],
    //       tx: {
    //         amt: '13000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001047e5b8e255d8cae9645156da805c31423604d4147e11becee10b1a456e28d978f0300000000ffffffff7e5b8e255d8cae9645156da805c31423604d4147e11becee10b1a456e28d978f0400000000ffffffffc303b28c276a99552d43ca9019bd0558df89e06a85f371949bc5b36c7f5bb3960000000000ffffffff7ce71efefca2ea0ecd555089539de09e87bddbd5c9f701a45a866528d594e12f0100000000ffffffff06b004000000000000225120287524f2e3d22b21e47a48cc42bd38453eff8cb63fd9139e86911bcb1bde2a2d2202000000000000225120287524f2e3d22b21e47a48cc42bd38453eff8cb63fd9139e86911bcb1bde2a2d48b80900000000002251206cc8e364e5d91942240d4ac7d2c516bd8df1464ac373e08d9bb9d89f785552e25802000000000000225120287524f2e3d22b21e47a48cc42bd38453eff8cb63fd9139e86911bcb1bde2a2d5802000000000000225120287524f2e3d22b21e47a48cc42bd38453eff8cb63fd9139e86911bcb1bde2a2d54cd030000000000225120287524f2e3d22b21e47a48cc42bd38453eff8cb63fd9139e86911bcb1bde2a2d01401075b84940073b1c27ef7279e638ffcf84470b2cd59dd57ba0b58dbcfbdfedf358d3f773f9d6b487d789fff2008e45b7b4ef650fb13e1005507b3288a14ead1e0140281c93a3b4edd05b6e68af1d367f2fa76660a55b0829b3c47c418055d4cc2cd046d36f65b5c85c72551b78d92b0bb293313f1d3f74472415707ed86cf8efe62b0141bc5481238bc8ad05d286809a6e5a3962e3d6ea2d0046b5a524e231065dab49b0741f0df54546e2d583ee7c72f2c9c1f07cf59e3eb3fd47bb5bccd9281348c61c83014099385069f99512574e8799d073905d546f99ac6e8834d43094d558ff097fcf44f0d79c035ed46b34784c4c3f9c107a151f45b23e1c58635cb6b74641afac794a00000000',
    //         from: '0x51206cc8e364e5d91942240d4ac7d2c516bd8df1464ac373e08d9bb9d89f785552e2',
    //         'from-bal': '6100000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120287524f2e3d22b21e47a48cc42bd38453eff8cb63fd9139e86911bcb1bde2a2d',
    //         'to-bal': '13000000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x7aaf64fc89d7dbe1873f40cd3bcd6f024815501a3f7ddf110521785ec7fb07a8',
    //           '0x5d0d75577c38ff29af7cb8418ed956261d7eec7bbc1f48864597c7d5b345f501',
    //           '0xf8802eb7670378f1e2a518fada41e84e16d21974eec3eefef0983a23cd051480',
    //           '0x38fec0f1792029a3426a39e21609e37990d2a6d88e3071b6ed098037ed1f6eff',
    //           '0xc988f6d85e3b694736dc3b5c664a1a0190effbccd9e12a5207ab7a9de1a83f2d',
    //           '0x17ff3c59f1324ddbc5b6b215579253c3bbb0c22252ad4a836b3b9cb6ea445437',
    //           '0x9167de71b396d62793e824bc19ac4a22cf46452e32d0f0561d7af3de45977fe0',
    //           '0x57f7684ad7dc4fc4fe6377a60ff52b03dcf2f4e08b9423976d1dcf2bb6fb61b9',
    //           '0x9355e909028deb66b8f72889a820c545057644410b934ed9827ac2302e2e6886',
    //           '0x6f30f7c2001275fb0066eff48d1f780aa57854b34ffc8b5c5730a06edbdddd1e',
    //           '0x62061ca47001f9c2f5b6b16d89bdf84d7fe11f483d877512b2dab0fc251f63e8',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '1006n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x08b393692ad8890ca6d45e631e1c6397ea8cc3bcd2cfef0667a0d4a8cecd1167263846d24d1d1801401b746e7a86c0637ade6ca8c87651eb8d8d4814e4ff006300',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x85f30682767c4f813614336768a5afafda1c025ca24f810226c044df30ae8df0',
    //         },
    //       ],
    //       tx: {
    //         amt: '120000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x0200000000010542cb2488306d5cd08a8c1afdadc9ec4426ea5d91732785282894ae7f4a62643c0400000000ffffffff42cb2488306d5cd08a8c1afdadc9ec4426ea5d91732785282894ae7f4a62643c0500000000ffffffff0eb9057e4bf5067deb24e655588d8a1334bc932e0851bb299437fd4e73d00d7c0000000000ffffffff5de3ccf199e4901b87f4e2ab9ff00387f7e2c545913cc41b2383769c3d8c326d0000000000ffffffff42cb2488306d5cd08a8c1afdadc9ec4426ea5d91732785282894ae7f4a62643c0000000000ffffffff07580200000000000016001465ce5bc0bdf53b8d80c9339e44db0a299e6d8d622202000000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d1400f56000000000017a9141c18cbe55647767c9fd3208282b04c658bcbe3188740b00000000000001600149ec49ef7a7d5b5184742b47980d4e0462fa1b6ac1be8d90000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d12c0100000000000016001465ce5bc0bdf53b8d80c9339e44db0a299e6d8d622c0100000000000016001465ce5bc0bdf53b8d80c9339e44db0a299e6d8d62024830450221008357a53cd1560df700c2f990e7170c270aca078691560fec380c45132dea22b1022036623f882a03c4886fd83dbf6ebc67594b4fd9c7f93fe346feef78ceefad8bbf0121033dcd1ec32f37b861cca160e78dddc2a469f0554121f88f047a883ebc7571630c02473044022074bba8f80f24ef7f6d35888c3b40d82507bf292e2edd67b60b4209961d7e186902207540a7eec96452d886c9f4f800382e431689d98d718930341e0f8c91915c60f80121033dcd1ec32f37b861cca160e78dddc2a469f0554121f88f047a883ebc7571630c0141b0f9061d5ceea2f9410e41608e017f4fdf66f0f99d74d67681003567068da0d9e47bfe3d20da8571bd0fa191265d27b789129f6ea25f3a56bf4bde6e3898da5d830140dea2db666193d92446d6053e0b0cbf20d32512383b7b0a19b7bcc9df188c03e82fa6e53d888f47cc1d09aa8e755dd8c359022b816d2035b10ee2080b85800f7a02473044022053359e3d580bdf3ec80e2b1a66c5668b2ec7a7b00a06ef4005f3a4e8228f490302206b08dda182069639f1dd5582777211e8d7b4df638940754dc5129f48bdfc94ed0121033dcd1ec32f37b861cca160e78dddc2a469f0554121f88f047a883ebc7571630c00000000',
    //         from: '0x512059f802d2d0a21d7ac691abfd346db965cc7103b07130e35f387c5b4c6051a87b',
    //         'from-bal': '648900000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d1',
    //         'to-bal': '2533600000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x2771c3d7a6c96003f5ed9b5b67306bd084adaa87ece00a99b6df6a85ffa3ddc0',
    //           '0x5d0d75577c38ff29af7cb8418ed956261d7eec7bbc1f48864597c7d5b345f501',
    //           '0xf8802eb7670378f1e2a518fada41e84e16d21974eec3eefef0983a23cd051480',
    //           '0x38fec0f1792029a3426a39e21609e37990d2a6d88e3071b6ed098037ed1f6eff',
    //           '0xc988f6d85e3b694736dc3b5c664a1a0190effbccd9e12a5207ab7a9de1a83f2d',
    //           '0x17ff3c59f1324ddbc5b6b215579253c3bbb0c22252ad4a836b3b9cb6ea445437',
    //           '0x9167de71b396d62793e824bc19ac4a22cf46452e32d0f0561d7af3de45977fe0',
    //           '0x57f7684ad7dc4fc4fe6377a60ff52b03dcf2f4e08b9423976d1dcf2bb6fb61b9',
    //           '0x9355e909028deb66b8f72889a820c545057644410b934ed9827ac2302e2e6886',
    //           '0x6f30f7c2001275fb0066eff48d1f780aa57854b34ffc8b5c5730a06edbdddd1e',
    //           '0x62061ca47001f9c2f5b6b16d89bdf84d7fe11f483d877512b2dab0fc251f63e8',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '1007n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x3801e28afa202c46596aa6902bc5356f382b296776d6bb2b4d9cccb2d81ea614132041ac05a2dac8eeff296e04a0dc858aefeaa25f9632951e16d0c3aebabfdb00',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x4c7b8c186a9cdba8077f318ee0ec6c5aa2bfe615a4a7c48c75f61d1e8b486279',
    //         },
    //       ],
    //       tx: {
    //         amt: '100000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001052f2197b283c8c0167a979556e54f1315a1881da0f6b6716a613f215f27eacf3d0500000000ffffffff2f2197b283c8c0167a979556e54f1315a1881da0f6b6716a613f215f27eacf3d0600000000ffffffff80de37023c6b23b95d9f59d3e0749728e6fb2a43147566d643525c4ebd6be6540000000000ffffffff2771c3d7a6c96003f5ed9b5b67306bd084adaa87ece00a99b6df6a85ffa3ddc00400000000ffffffff2f2197b283c8c0167a979556e54f1315a1881da0f6b6716a613f215f27eacf3d0000000000ffffffff07580200000000000016001484e555e462dd06cc4a4e4c51845c3bbb5164db0c2202000000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d1e0ef480000000000225120cf6990d714ee03db4982e43b1230b9603efcb4c7b7dadbe358b3136739f1ba006095000000000000160014f8f14cf98a11b18f53ff4b0db19dd6ed574a614f0de78f0000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d12c0100000000000016001484e555e462dd06cc4a4e4c51845c3bbb5164db0c2c0100000000000016001484e555e462dd06cc4a4e4c51845c3bbb5164db0c0247304402200dfb9fa35dc1c1003478afec4a9d94c0abda5962e0c7f2903be4c3eea7486b5902205e65941152481dfa6fac59e0ed1a583d34e3b0cbfbc4d0ec131ce83ab9c30653012102c669cea0e180beed90fb96ceba7a37bcc952a8171acf2f8f49159a6ada7dcacb0247304402206743f30dda7a26834fe24c97c0bb0980885aa6081facf02b5aa948e6c8a36905022065775b3321bdcb92ce54061595f7400c26fc22237bd45e42f53b2c2a2c666a90012102c669cea0e180beed90fb96ceba7a37bcc952a8171acf2f8f49159a6ada7dcacb0141fe98570d7d3a05ae0f36da3e64f7f5deee6979071da11aeac4c15ecd7903a35a5ad8785ba17a2dd557b77da81d25e1f5fcd63bfb34692d84caec9467e79be21b83014036a0d61d90f191c5782a1cb18423ee69cf1adb9b3e1d409111d802e89e5187288fe90981f683c77bc64a91c0cc4adfc2118502d94979503affc4d90faf2c49940247304402205d5335b16cda4223793b1b9ce1178fc9c3af2e7b2f13b72721ed5946deefdfec022032ad5d2be05d77dad69c0764cf504a1b8fef1c2e934d963399c0a9b4a443161e012102c669cea0e180beed90fb96ceba7a37bcc952a8171acf2f8f49159a6ada7dcacb00000000',
    //         from: '0x5120cf6990d714ee03db4982e43b1230b9603efcb4c7b7dadbe358b3136739f1ba00',
    //         'from-bal': '1600000000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d1',
    //         'to-bal': '2533600000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xb49621b67c9189bc211011e9edcc2f17f7f8843dc31032d6bfc916e7f181f227',
    //           '0xab407887793d0f26d29d907b7f1295271bd58bdfe7731f8074c488d0ced916fe',
    //           '0xb925b5042e1d6ef539ba684fd1bc9a292e893115fe9c0dd1b7ef5c9de95725d7',
    //           '0x337bac6498bee769578e895a0a43069e356fd1fbfd4f8ac988bfb67bde490aa0',
    //           '0xeef1f463fdf694cea52d099fccd11eb289bc648fae05af7f2b46bcb438229618',
    //           '0x17ff3c59f1324ddbc5b6b215579253c3bbb0c22252ad4a836b3b9cb6ea445437',
    //           '0x9167de71b396d62793e824bc19ac4a22cf46452e32d0f0561d7af3de45977fe0',
    //           '0x57f7684ad7dc4fc4fe6377a60ff52b03dcf2f4e08b9423976d1dcf2bb6fb61b9',
    //           '0x9355e909028deb66b8f72889a820c545057644410b934ed9827ac2302e2e6886',
    //           '0x6f30f7c2001275fb0066eff48d1f780aa57854b34ffc8b5c5730a06edbdddd1e',
    //           '0x62061ca47001f9c2f5b6b16d89bdf84d7fe11f483d877512b2dab0fc251f63e8',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '1008n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x4efa36ee055e7a734be0a4784fa974cf551d2decda9f218646598d72cdc1326966332b8ce70603aa3bf18152781dc60b83ca8bc5efbe29d19a5784d7afef146d01',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x5227fe448027169f7c05185febff9e16cb49b636b1b58f92f8cde80b2d3031ca',
    //         },
    //       ],
    //       tx: {
    //         amt: '120000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x0200000000010549e31a9b659b0ac44bc87b2b4a2773c2537c493436e5f1a47fd4d9b9285a4e2d0500000000ffffffff49e31a9b659b0ac44bc87b2b4a2773c2537c493436e5f1a47fd4d9b9285a4e2d0600000000ffffffff6741048da70a35ed4127261db30f5af0bfecf2f6105b042315a8357a06649e080000000000ffffffff7aaf64fc89d7dbe1873f40cd3bcd6f024815501a3f7ddf110521785ec7fb07a80400000000ffffffff49e31a9b659b0ac44bc87b2b4a2773c2537c493436e5f1a47fd4d9b9285a4e2d0000000000ffffffff07580200000000000016001432a98fdd1fd6019cfd87e14a0b43c11e5aaedb772202000000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d120b557000000000017a9141c18cbe55647767c9fd3208282b04c658bcbe31887a0b3000000000000160014d1b7708f28307b0dc70819a470e6f86a7c91fa2dc604370000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d12c0100000000000016001432a98fdd1fd6019cfd87e14a0b43c11e5aaedb772c0100000000000016001432a98fdd1fd6019cfd87e14a0b43c11e5aaedb7702473044022070ed19a9fc8a5403065e780381865809084ae93996d3e8972de27846faf9bcb10220353d8448f53256de2bb0fc21996128986eda4002d10b50afff0916e36a0839320121034d6714d250367878574320e172cd34d608f26e03b43e926fe5a84e8f1a49153e02473044022051298e660c8ae11df3fe6490e4b75a5787b21a5e8b5d75606065db7047c392f00220431e2081795667d1a13eaf3c700c1cb168f1d508e605447e7f0622482cd443020121034d6714d250367878574320e172cd34d608f26e03b43e926fe5a84e8f1a49153e01418d7d2fd16ed158e72d99c16c8313dfeac184fcbacc47d275ae09f59dbf2343d090ddfaef6b63aea14aaba8371694d2939bfab1b22c27f85d91df9b02f74d81fb830140e9ac6d8be22dd9bffe0f4d3f6940cce71a781cc57f8413f435f17ab7943ca664cff7ca75a349a011ba7b3135ab10ac0ce488df1a01c9fab2a201e8121fe857c50247304402202ef7dffdafe0c41a3f38b87732a5ae275f383cd672509377f1617a554924a2ad022075e531bcbc35d84c117e438b0ef1952f559e5b15defd107744edee720e9ee21b0121034d6714d250367878574320e172cd34d608f26e03b43e926fe5a84e8f1a49153e00000000',
    //         from: '0x512059f802d2d0a21d7ac691abfd346db965cc7103b07130e35f387c5b4c6051a87b',
    //         'from-bal': '648900000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d1',
    //         'to-bal': '2533600000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x414fc0e20ed9f9d2a9c278298eda733477557c9d4ccb6d233fe8535bb9a69e30',
    //           '0x96a57b607b81b857e373f42b23643c1bca9bfc19edfae48e950bb970ad995bea',
    //           '0xbf2d5d1efb1f56f976819405bd74bdb78ff7e57114ad397a8450c68c88b3a93c',
    //           '0xb492805255d2cabb2f47d1006555f1f97e9bde8087f57bb2db00a491d8b30fc3',
    //           '0x0b0db709e56a3b421c43c9fb3edb52369fb5e4857ef615d5ee48b389f8e9512d',
    //           '0x7494c7ab5c6b54ab0114324190c6935d613f754bbbdc8d13854a706ba2330002',
    //           '0xfbd34bb146fed53696d6d3fc681de50de17fa8fdc724740f036b504dd757620c',
    //           '0x282ef80d4e98fb460733a556dcbdfb00cb73953efb482e2b1702bd45c24116f5',
    //           '0xf94bf3111f5da97fac27ebd6b18b2b87a7d9e807aa7a166fa4fba6339bc8a71c',
    //           '0xf554d1515cb8c84bd6ce1650f46ea28c323173a41c1caad3f9c3339163655525',
    //           '0xe2dfa4caa6e0daf2700994b994f4b2f9d268a0f964a9325faaf4ae195845f6bf',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '1063n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x759c2c387c31461a43eaa32a16764f850d61ce354a0050d5d97082e24c84da3e258fdc12e2549118f4e0cf2b05654f4a8af6ecfe3466e1ede502234fe02d631901',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x3856381e795015758922f4ee185313cddb4cf51b8fa11ed9fa1bf131da2cf530',
    //         },
    //       ],
    //       tx: {
    //         amt: '60000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x0200000000010578c77c61e42047a0ecbb25c9d5ab42035b1447a2a690be98a99f6cd5b2ef11d00400000000ffffffff78c77c61e42047a0ecbb25c9d5ab42035b1447a2a690be98a99f6cd5b2ef11d00500000000ffffffff68801cc1180a871f1c99b08a6676118e132bd0870f0d2a6262e86b6dbc2af1660000000000ffffffff913421284cc7bb5a4f57c21a09f0302e5979f05298481da3f87448bcc1c374e80100000000ffffffff78c77c61e42047a0ecbb25c9d5ab42035b1447a2a690be98a99f6cd5b2ef11d00000000000ffffffff07580200000000000016001468ff3e25c85c7090d1d57ec18a525414e668787522020000000000001600146d40b62c1c8cbe224f2f61b94de511fbd9adf9e5203a2d000000000016001433fe27643e06c1ff7d9cf1ecc9dbaf73ace019a5a05c000000000000160014f48f9dfbb0d96f6b0045e6c2aa8d24b4525b77f792a20900000000001600146d40b62c1c8cbe224f2f61b94de511fbd9adf9e52c0100000000000016001468ff3e25c85c7090d1d57ec18a525414e66878752c0100000000000016001468ff3e25c85c7090d1d57ec18a525414e66878750247304402202597f0ae4fa12b6947af273c35c4c0011ed1869f8a9fa9b0ad475dcebe04a8a302202184cf4623d1964147ea1f19ac1a1f456cced6358a5f4fc5a4547e860d578d540121034c8fb27832d6a1724f75b3c4ec1f01c3064168fa838c34ba67ddb7bd6fe9741f02473044022027526d3758936a103aaa9f24d6ccc13deaaa50cc46c8caba9c59136e822823b102201a9638c848c671aa3a1b77e768a530ad8a5174ebf2ec99ea2dcc8ba00bd982940121034c8fb27832d6a1724f75b3c4ec1f01c3064168fa838c34ba67ddb7bd6fe9741f02473044022031aa805a1e6a1cf196077d1dee37d1d5dae9a83d5fc78d5394ebc39b8e95bcb0022045f815cc87ec143604bf39c821652a92fed493289ec4ddc465e4879c26107bf583210372fef9a9c2aec9c1df5f9d79e24062db318435a428640d5e382d565eff90367002483045022100bbf896c2549ecd3f17b8a9a6629f640facd3749492c0cd31652888bbd5e1b8ad022012e82867461ade0606a3e41b1643747d617e8e94b8b4921f8f5fcb62bba52e32012103210633e8c643df33e5a1e13bc99371f5c7619e9f90c57bb669524caf5d42ff150247304402206d0ee6507c6e5a888149dc41bc71f3eaae823abe7489850d413238ebc4023a0402201668d589c7726ac48395647fd036af84ee41b64e62532d3ed5d88057d0b070c80121034c8fb27832d6a1724f75b3c4ec1f01c3064168fa838c34ba67ddb7bd6fe9741f00000000',
    //         from: '0x001433fe27643e06c1ff7d9cf1ecc9dbaf73ace019a5',
    //         'from-bal': '0n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x00146d40b62c1c8cbe224f2f61b94de511fbd9adf9e5',
    //         'to-bal': '60100000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00c0bc260b65af2caa719eb37ca9fd2d0650dcd445695130905303000000000000000000dbf5da009afb92a5d76890dae326f395c30a124661520237f1af42be1ff22f76fb1d0e657fed0417039d424c',
    //         height: '808896n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x0c1c9eddb9565c9b22e906c50435fdfd4df9cb3975fa19600a093f9cb5bb1b9e',
    //           '0x111689be1c4de7db11aa2326a884eef61fb6e97b6de7484110e4fe4d2ec192ae',
    //           '0xf61d9af98818f3d87a62a3dacdf2e2a73f1760c12e24dce975fae77894449796',
    //           '0x140fffcc86cfbea8ef4793a57c3058c65a3a4b70a9ad04218dbcd32eff076058',
    //           '0x96853aaa9d5de47261c04c76d9ed13d35e4427015cc137b451b2fab02050fb33',
    //           '0x53c6d6e2bf4a8ac85aa7009d6cd6b659e2a6f4a07643607d550a1556b63cbbda',
    //           '0x12c890d7e7fdda875678484c161549ba43442b41dcf1c5a9d5719fc1cc2f3d21',
    //           '0xe0884961af4613d9e6bb30cc33eadc86682194ac2222e197ca2e8d630d1c29a6',
    //           '0xf94bf3111f5da97fac27ebd6b18b2b87a7d9e807aa7a166fa4fba6339bc8a71c',
    //           '0xf554d1515cb8c84bd6ce1650f46ea28c323173a41c1caad3f9c3339163655525',
    //           '0xe2dfa4caa6e0daf2700994b994f4b2f9d268a0f964a9325faaf4ae195845f6bf',
    //           '0x549d31ac39c15a581a0d0bf1f15c0beeab437863688a9249643546d7c44cb1e6',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '1255n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x892271542b8dc98909e4d247b4403a13c61ef8c6d5796d449d0040e8f5d1be981520b996a82d0d23b9dcc3252f23fbb67d05bd527b9541e845b20f18cfdd72c100',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0xdb6620f199bb630563acc46077caf9561f6a100f9adc0f5bfa5a72e7ee5f9fdd',
    //         },
    //       ],
    //       tx: {
    //         amt: '100000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001023ee8565db6f73ead6b78774d7022bd9edbcee49962a5be345bab8a2483bb70920000000000ffffffff464b569edf1b81a744296c3079b035d3e936e2789eee8d45ed2fecef282fe7a30100000000ffffffff022202000000000000160014dd517067eb4893a97cd70f939d5f53566e295f5c7b03000000000000160014dd517067eb4893a97cd70f939d5f53566e295f5c02473044022025a53fcb8e48e75445e27eea976b24f90ca413e0923d081bae0df7427675fd8c02201d79098c73be1a10c5807e6ce6c51c8b2394e9d007816ca8d4df893f68d2b0780121033e7c718222e2935c9aa1266f9e2d6c67fed67d66ef28681bd03f370c9893258902483045022100d7d5768cd264d72b88baf5e26210ddcf5b3e0ad39f6bd694272e03aebcf40dbd022019b10eafe65abb23a56b385909d2c344a2e45a0f001580747bee7d70c4dbac660121033e7c718222e2935c9aa1266f9e2d6c67fed67d66ef28681bd03f370c9893258900000000',
    //         from: '0x0014dd517067eb4893a97cd70f939d5f53566e295f5c',
    //         'from-bal': '100000000000000000000000000n',
    //         offset: '0n',
    //         output: '0n',
    //         tick: 'sats',
    //         to: '0x0014dd517067eb4893a97cd70f939d5f53566e295f5c',
    //         'to-bal': '100000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0ff374f917f84798d44afdc8c397d90a55b099f42a188d5980400000000000000000028f8c814e26a99ae39a559dafe1a3ba9a7156da18ca5386bc124b6b66615f60f8e1e0e657fed0417109cad04',
    //         height: '808897n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x69c5e52882c24697ecb0809688d364cce50175574e6d2c77545cd5d2f1bf39b0',
    //           '0xedf626c5a7d4fd9414dcfcaad9ba3b287f531196897fe73a08a68839f6f7625f',
    //           '0x74de3206763994361e2530d132fb64e30090ed1392c5798a2b170147ede2195c',
    //           '0x2fbf6a004401a4131dbeaede5338ef9c3c173769e2b5f2c85bdbcabbc6a349db',
    //           '0xd9ea96d6a4c6806a0189fc0420f96880563ec36b9b0548107e4564fd310795bf',
    //           '0x55e869890c4f1144c9321bac62432d107907dc2af8a53f5c510fb08a5b7e51b3',
    //           '0x18daf10b4e4818939b6e26747cd020ef1bec8313938f361ad05485cffdfa3143',
    //           '0x5909e6e1a98afc7202008b1e91957aeb20daa3e3d2f70ba0a17fc1c77bd579dd',
    //           '0xcd3939f6b2cb0aecc2cb1dd1a1e0ba396fea4746bdc30a546827cf71b163b30a',
    //           '0xdc8200fbaad2a7213314a59ffdd65343139a3104e7444a3747e8b53077aa468e',
    //           '0x741fbb49f79fea5afe43fdbff6e752492cf54044027699abcef0903ba52c94eb',
    //           '0x4a17aeca05e7e98d0aff4c58bea13c47a20f7c63b9d0bda284936ec6b2003761',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '154n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x115082054a9e069a03e30947b4174344d6fd6efd57d3743d2fe0b00a92dd8711036ae947c173c8f4ee3b4924ad38ad92337e42890f96580871af09298f02941501',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x5332df35409becca963f9db299c5b375caf93ef4ce99a1c60c0148d2dd3bdd32',
    //         },
    //       ],
    //       tx: {
    //         amt: '100000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000106528fb5486a69efb888da95cf66f8dfa4f1b8b12ed44ba4a14d41bf098971bad60400000000ffffffff528fb5486a69efb888da95cf66f8dfa4f1b8b12ed44ba4a14d41bf098971bad60500000000ffffffffc343678b46722183c924d4370cdcaf31daf6cd70d15ff1826737d36490d81b3a0000000000ffffffff4c1976a69db5eddb34b6d194a0cdff26d3994c67431fbd59da5f4071af8a63310400000000ffffffff927779393b1aed45a35f47c0e4462128ef29d479e8c5bd579eea6de6d05287f10200000000ffffffff528fb5486a69efb888da95cf66f8dfa4f1b8b12ed44ba4a14d41bf098971bad60000000000ffffffff075802000000000000160014346e16f0f5962ef4bfa05f1ccf848ba21edf83c12202000000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d1003e49000000000017a9141c18cbe55647767c9fd3208282b04c658bcbe318870096000000000000160014294a7772136cf0436a80b0a69613180b9e788efc96d2190000000000225120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d12c01000000000000160014346e16f0f5962ef4bfa05f1ccf848ba21edf83c12c01000000000000160014346e16f0f5962ef4bfa05f1ccf848ba21edf83c1024830450221009fd4e38fa65761fe80eb73e9910e47feca1cab9d17f4b00c7e1ee6ff5e20862202205b39f7e8d43f2a20be270616026879bbba5df7b437186e1b7b2505949477e2fb012102bc180ff8d5b56c3720d2bd1cc8c57b18000e3155a01f45dae08507f2f02b4bf10247304402207b0b77c2d5737455eec3cb908d1af16d97bab589a1027b1fd602efd6af3589b102206651e879d1c427e139c0f6d7b25ce3d3a63275451d9956564e6a0e00b2b4e506012102bc180ff8d5b56c3720d2bd1cc8c57b18000e3155a01f45dae08507f2f02b4bf1014129cf601f5e6285dc4b427d6e33c9ad0783924999de7dff2a7d5cb73d77e26be63115db9ce19a381bbad8c5754d27523e5563a79524270331532dcd1b546d0c828301409b5a7f188a458d4bdc0526f6726568cb32c0a05b7aa64a8c444187fe4dffd13bf957270b5bd5635c24fca7bf13ab85d5237c9d9f3a3ecbf560e789e67fc58ba201405786962764a1905672a913f734fbef76826c71b9b1007830138df5a6e0549059623bb7ad4b83ec447ddd1401e552372dc0fc26e81b522f2598c1e23fadfd43940247304402206708d4d3d50cec4db0b1b21af6db5041415fc474558785f15b746a04539212af02203fda448bdfefb42558f6d3527e4c569ca390c66a6008ee6894ca9ca7c30bf997012102bc180ff8d5b56c3720d2bd1cc8c57b18000e3155a01f45dae08507f2f02b4bf100000000',
    //         from: '0x512059f802d2d0a21d7ac691abfd346db965cc7103b07130e35f387c5b4c6051a87b',
    //         'from-bal': '548900000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x5120dd3d3c3217514dcacf5d01d388051f86f064b1f0ebf9029d95b556f9a9eda0d1',
    //         'to-bal': '2633600000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0ff374f917f84798d44afdc8c397d90a55b099f42a188d5980400000000000000000028f8c814e26a99ae39a559dafe1a3ba9a7156da18ca5386bc124b6b66615f60f8e1e0e657fed0417109cad04',
    //         height: '808897n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x174fd09c71153d889e739827297fa901d697db86f2fff815648f7ea307d70605',
    //           '0xab9ed517901194d3c200864d71dbb02ca07247447087d5e6f3b5e611b07bf60f',
    //           '0xe888d159505516afddcf4434d43ce08d2af466ae17fe8393ac20d9c75280aeb5',
    //           '0x2fbf6a004401a4131dbeaede5338ef9c3c173769e2b5f2c85bdbcabbc6a349db',
    //           '0xd9ea96d6a4c6806a0189fc0420f96880563ec36b9b0548107e4564fd310795bf',
    //           '0x55e869890c4f1144c9321bac62432d107907dc2af8a53f5c510fb08a5b7e51b3',
    //           '0x18daf10b4e4818939b6e26747cd020ef1bec8313938f361ad05485cffdfa3143',
    //           '0x5909e6e1a98afc7202008b1e91957aeb20daa3e3d2f70ba0a17fc1c77bd579dd',
    //           '0xcd3939f6b2cb0aecc2cb1dd1a1e0ba396fea4746bdc30a546827cf71b163b30a',
    //           '0xdc8200fbaad2a7213314a59ffdd65343139a3104e7444a3747e8b53077aa468e',
    //           '0x741fbb49f79fea5afe43fdbff6e752492cf54044027699abcef0903ba52c94eb',
    //           '0x4a17aeca05e7e98d0aff4c58bea13c47a20f7c63b9d0bda284936ec6b2003761',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '156n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x32749f0220fe28e657dd2007d5baa05e79fdfd964a6d972ea3752e4c7344fd112f19f4628fa4200e48e2f638a70cd91f8f051e38e1be0d0fe3581c4cb46e593b00',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x460ce694075d533b2b5e08020aecefee26852e23658c3f03ee4726cf52626b23',
    //         },
    //       ],
    //       tx: {
    //         amt: '18238000000000000000000n',
    //         'bitcoin-tx':
    //           '0x010000000216c31014f00e8daf608cee022dceeeed78c0ddf5a70128a1bc6e2861fb7aea12000000006a47304402205aedcd0ff20e063a14472da42239aaac8c47c26ab4939f2137187639c94a787d022074c5a7767c140a3b4083823adf614f52863d520b7bcc7f7334e6f5a7531406e30121027c5b4fa4aac0696636fed8f91e6037509d5fb489980be15cbe5f5267b5b89314ffffffff02ed9107a0bd20c9d193b1c1b4805f2020ac1b14cbd6675069a73da9a6de75ac010000006a4730440220317c3af5d7316ae9dffd098fd3585c8d3266213d135d878ccddeeb9297da5ef702206bdccc95f6c1b2f9d65d248bebab294f52941572fd3db429f017fa68438be1c10121027c5b4fa4aac0696636fed8f91e6037509d5fb489980be15cbe5f5267b5b89314ffffffff022202000000000000225120c949d1b71d3745afe3b1e433f56de910a32e2b838d2ec064989c3e05861cc5cbbb630100000000001976a91439afaaec0d713a074b3cecb00b4dcf9e5d80833d88ac00000000',
    //         from: '0x76a91439afaaec0d713a074b3cecb00b4dcf9e5d80833d88ac',
    //         'from-bal': '1343217000000000000000000n',
    //         offset: '0n',
    //         output: '0n',
    //         tick: 'piza',
    //         to: '0x5120c949d1b71d3745afe3b1e433f56de910a32e2b838d2ec064989c3e05861cc5cb',
    //         'to-bal': '18238000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0ff374f917f84798d44afdc8c397d90a55b099f42a188d5980400000000000000000028f8c814e26a99ae39a559dafe1a3ba9a7156da18ca5386bc124b6b66615f60f8e1e0e657fed0417109cad04',
    //         height: '808897n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x710f49c83827f8bdd430cfb066deaa356fcee237fbb5f6e9b9860785df176fd7',
    //           '0x9b94d87e222ee5fe78a75c0cdcb25365aaae2bd7b0270966eb0b6af7c57bd990',
    //           '0x7bb5fce8884037efa7bc2ac3d458b46dfd13846ea57e25d2800c7802290004bc',
    //           '0x55e52c9fb0609afb7bc2c6f3f873a5f256776e140df9bcf49e9050c388a85608',
    //           '0x7d7defaff25c5b12ecdfb1e70fb23be13def17315f1cebec2e68b105164ad19e',
    //           '0x10e56e26e9be210553973f53ea74b394d9085ba793150e0465d2148865f31897',
    //           '0xae2f03f2d8cd207a42c7bca07e4038aaabb8fed696f1e2cc633f5defc68b2a9f',
    //           '0xd8af628b6aff21ddd0dacdd875abb5b8b01249f0ac9cc9b55c771cb57e57a95d',
    //           '0x3823bed72e66d73232e8f03f03c66b926970f3da5be3f260114642153048524f',
    //           '0xe82860ca12a17bec8c8f919c6c90373b45dea76ead26c6a575e0e5341a826238',
    //           '0x90ce618388a2faf031d078b06afbcf05a4ec1d3ce553611eca25d006baf8c05a',
    //           '0x27b2104cafb04dc11d5cc4a2b240c909c4c7db4b28ff49151453d57b27cac7ba',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '2786n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xacb2f4dcc3657a81b4a669b40d2dd2b6abfe466d22d4fe4ec459a525656e01ea443f88461e3a80c2d6cf0d177c660240a9e6dbcef12d6dad8d83ba6ce3b774fb00',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x5bde72d924f0896fa98e9e679d69f3c49ec8c1142bea17c00147bf95ffa951af',
    //         },
    //       ],
    //       tx: {
    //         amt: '360000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001051cc495d40041310d9eaf708d46f3b1adb319aaadaddfc18d8b7eccec8418decd0400000000ffffffff1cc495d40041310d9eaf708d46f3b1adb319aaadaddfc18d8b7eccec8418decd0500000000ffffffff3d7b5ff2de7b0b7961899df9f03806fcee4e71ada25653552fbad62a0e2c49420000000000ffffffff1947045c5e335dc6ddc6c65159a3eeed7a78b6c39dd456b77f8468b9493483b30200000000ffffffff1cc495d40041310d9eaf708d46f3b1adb319aaadaddfc18d8b7eccec8418decd0000000000ffffffff075802000000000000160014ec540cc10ac6f20b016931439ef4f7414d19bafc2202000000000000225120c6a4ad07864ee11e2b366b4ff34b4c85c9ce41da7979327dfa315dbd53ec5f16e05a4c000000000022512049a4f2a3533fd58cb1174119718683c932447bbed9f344a8b7f35732d108e0c5609c000000000000160014165edeffb826c1aefb8b7b2490c224c6998cb53c76b95e0000000000225120c6a4ad07864ee11e2b366b4ff34b4c85c9ce41da7979327dfa315dbd53ec5f162c01000000000000160014ec540cc10ac6f20b016931439ef4f7414d19bafc2c01000000000000160014ec540cc10ac6f20b016931439ef4f7414d19bafc02483045022100c535dc6905a4a549bb9712101ec079ec5ac703fe7ea71c67febdce6f527df90f0220331b60246e769fb39109acaa4d33a59a58c52af373341655d4ab63861f15ff57012102b1bd891764fe82ef1f24b38a772f4f4eb650f1c4973e70f73ba0c09f87b22c6302483045022100f957d0ad3befb5395675d806a8bcfa9d24652f6dd7017a8f6aac65fe54bfe96b02200a23b5898a44c6894015b7d10226ff21f92de9c946751fd3358a550e4fd6debe012102b1bd891764fe82ef1f24b38a772f4f4eb650f1c4973e70f73ba0c09f87b22c630141e07752c8606199ca243fdca5c6a6a1379ccdcee1a1d88cac8befa923f678e2267914b9e189b7607e3033a8777f04179fc48aeefc073202790210818e5a6af7ca830140814e33830f9ffe7b1b8a234cbc53944aee5864876f7ae6fddab38ea760756b432b03e8093b60dfdc864f408861a608d4ea1c28320fa28907e6f495dfda920ea10247304402203840cf0f180f5fd4ee9b259ffc034df8f5da91fcc6317ed02a6b90c1f86f5cce02203718712f467106ab66fe982c68ff4c8e758e39966123a7ef0d466e7deb4761c7012102b1bd891764fe82ef1f24b38a772f4f4eb650f1c4973e70f73ba0c09f87b22c6300000000',
    //         from: '0x512049a4f2a3533fd58cb1174119718683c932447bbed9f344a8b7f35732d108e0c5',
    //         'from-bal': '0n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'ordi',
    //         to: '0x5120c6a4ad07864ee11e2b366b4ff34b4c85c9ce41da7979327dfa315dbd53ec5f16',
    //         'to-bal': '660000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0ff374f917f84798d44afdc8c397d90a55b099f42a188d5980400000000000000000028f8c814e26a99ae39a559dafe1a3ba9a7156da18ca5386bc124b6b66615f60f8e1e0e657fed0417109cad04',
    //         height: '808897n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x7bf6a3a20e4ab9f0fc17c45a928d288f89a527226038f3ee3da1fa74a76d76d2',
    //           '0x4f717ca038bc8958118a442a1a7cd4979d342792fe8579b9c8555bd5f4470965',
    //           '0xb963d5a5fdda9bd5b24de5df7f16f87a4625133a2f813daa4dd94f0b794a7869',
    //           '0xea9c0dc6ae70df5a2fa95350a7cb1e4e6b4373684363a976d27da3a30df94651',
    //           '0xf2f2d526928a3bdeeaab1d248c5119dcfdfeed161804c17c0a3ea6ef5126d7e4',
    //           '0x186a17b64ea413b538ff16bb7ad7182857bcac220093fe36e4a1334584127c02',
    //           '0xa3640c13adce88be0b7bb03b41757a9e54d71dc9e9e970171f9dd76981c61929',
    //           '0x1f5d4a213312bb9da7d67f0e3f45e10e616b3afdb6242225ccd17b45658b7645',
    //           '0x35ccba779b85497e42e47a0f00a995f868bfd8fd1b02c07e37561994bf15727b',
    //           '0xe82860ca12a17bec8c8f919c6c90373b45dea76ead26c6a575e0e5341a826238',
    //           '0x90ce618388a2faf031d078b06afbcf05a4ec1d3ce553611eca25d006baf8c05a',
    //           '0x27b2104cafb04dc11d5cc4a2b240c909c4c7db4b28ff49151453d57b27cac7ba',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '2831n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0xc15f10ee72025a111b2fc96d55ccbf34d4f1ab1abf7e90555c806436996ca8ee210b37a0c4d619f2ad6c179cb776706ec533a1b1b68d33339d7d41a8a4353adc00',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x7c7eb1cdd16ffc3b34175dc3e6ca992d1f93139d1ef94e88d95d084cfaa31143',
    //         },
    //       ],
    //       tx: {
    //         amt: '27830000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001049252a20a91ad39afaa6fdc010ab3d350665d6723f5917925d07bd360e4c559380300000000ffffffff9252a20a91ad39afaa6fdc010ab3d350665d6723f5917925d07bd360e4c559380400000000ffffffffdac4c60797466b61023ffd33cc2eca3a78f07e6992b04b9c0ac4260100a0005f0000000000ffffffffabd4ceec3018733e8eaf995da712bd4c6bf8624dfaddc7404b3833b782b27efa0100000000ffffffff06b00400000000000022512024404d04c8909b09aa21e6d017904b0ebe813056b5c1e509523a0ef7357d2bce220200000000000022512024404d04c8909b09aa21e6d017904b0ebe813056b5c1e509523a0ef7357d2bce14541a00000000002251204d2d88254ff644c62f70acf9a796479fa7953955e87f620306bd09b3e30f0044580200000000000022512024404d04c8909b09aa21e6d017904b0ebe813056b5c1e509523a0ef7357d2bce580200000000000022512024404d04c8909b09aa21e6d017904b0ebe813056b5c1e509523a0ef7357d2bce78a903000000000022512024404d04c8909b09aa21e6d017904b0ebe813056b5c1e509523a0ef7357d2bce0140de731b7a35606374e378c75c5248eb027bb892e152806f2e20af87595a28302c71e892f94840d89591fdea1a0f365d8539091b22823041dcacf96a73019c054d01403f7e92da7d6a79a7e19aa73a429915afd5b33c90cbf80aa512e1c2f653036abdfd3928b850642bc930f6c0640d98b4aca7718f3eb18d138d81d0d37a13af00960141105f0e28b1ce28528b89d3fa14a540bf77ea9d1dbf0d8861a9f738ab956a6f00cbb03b6e0d4daf7249a81efcc8f9b68babaa7be77da248ec9f5d7b3d676681e78301406488f31a75f85068d50d0d6fd07c0a50782e948e6e1235c7efd43795209bd846c6446b355582ff495be9feb7d39e8979e00a1dd6483dc5137eaea513f9689b6d00000000',
    //         from: '0x51204d2d88254ff644c62f70acf9a796479fa7953955e87f620306bd09b3e30f0044',
    //         'from-bal': '0n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'fram',
    //         to: '0x512024404d04c8909b09aa21e6d017904b0ebe813056b5c1e509523a0ef7357d2bce',
    //         'to-bal': '173564000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0f32067f3cbd796b74a1105c3b9599ea97150b861ba2888fd010000000000000000000b1abab62b75a0a32a2d06f4ee371318791177efe9deacb6e612385e39ba3902941e0e657fed0417b88287fe',
    //         height: '808898n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xa44884884cf5e0cc8dbc8781ebbafc2feceb162e0fcc86f5176b40e7c3982107',
    //           '0x992b26f3908ea10acc0755b489dc446e3a322ec2fd0c583cb6850079c521442d',
    //           '0xa7c5c4af6a99e2cbc2e17c9f5248695aa96f4ac2baf110877f9a6e270c39ed01',
    //           '0xb8ca696ca4973308c9bbea58772216e86d4c294a596685ef06978a20087aebe9',
    //           '0x9aadfcdb304eaba52f367b7490c1da44394eb897c909a9f01b832f8744064416',
    //           '0xd5f41374ec8ea56c075ecd7abc3190c23d3c58b75dc740a53a8c0cbce0c159b9',
    //           '0xc0a642c7680bc5ee3bf5385ea6840dabb0382598d125b4a68e2203b67d5a7041',
    //           '0x4bca9ba09c13f9d95435e7e8fbe6feae65117aecb64dfcd8f995ec4d1320a969',
    //           '0xb9099a1d73e8b86db79a8cbfed60d478dbff74558ae16ec6edbe061bf7602192',
    //           '0xcfcef05a0bebd00f350dc6fb0cfa680d05fd10aa62eb4cd602943392b0417ff7',
    //           '0xd66b63dcc02752068629bb4e3cbeb531d4259bd5488f5f72e93025ffcfe3f4f3',
    //           '0xd46e863fc796618f9f43bc4b3983e4d23490ebd3bf8357f2b22e6740589d8bf3',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '212n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x91d9886ef3f56c12bcfee13de71fef60f5b75695147ab506a2788bd0c4bb61e17ad070a365fa99f5396ee3811297f51cc9614b382bf6c2368332f5c09966fc0c00',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0xcfce7558ea6997774a4cb54c680fc8b58b1c2f8c958838367c35c9e37d42e464',
    //         },
    //       ],
    //       tx: {
    //         amt: '3000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x020000000001055bfc415b1f6aa32c72b682eb56e62c5b68311dd6a229cbb95831e3b7b989a8a40500000000ffffffff5bfc415b1f6aa32c72b682eb56e62c5b68311dd6a229cbb95831e3b7b989a8a40600000000ffffffffd6dc040aa1ac03b5d893a283a116723d96ee97b05178d1b760e261b123f5e41c0000000000ffffffff380deab3db108c7028b847120cc2c4f048a8140f89b201e00e65fdb075f522790300000000ffffffff5bfc415b1f6aa32c72b682eb56e62c5b68311dd6a229cbb95831e3b7b989a8a40000000000ffffffff065802000000000000160014e30ca1d0213fa02501dabc7cb9f3d4c62869a7592202000000000000160014a9323dcddcdf4da26a976a86cd813f21828df2df7869000000000000225120c2ed9bc1edd290c28d00b8be0047588b3ea974e7647e3dba5aa58fc8fd87d1ff1324000000000000160014a9323dcddcdf4da26a976a86cd813f21828df2df2c01000000000000160014e30ca1d0213fa02501dabc7cb9f3d4c62869a7592c01000000000000160014e30ca1d0213fa02501dabc7cb9f3d4c62869a75902483045022100bce751842cadec88ad70f01592555c17c60fb6d9432543128a70784be66a25cc022006082e5842bbeb0f62fc3c6678241375a2d5fd97ab56a891ca81c522d905c218012102a02dd7e4e970441ca09a05924612a669e1c6ee5b780e3949cfc8501d9ba2ea0502473044022001e17236d9e6f14878dd3366486929aefe8b2bc8cb0e392efacf8085635e1dad02202c25e55d45615ef41e320c21b8e6a4a10a61e03a1f4bb5c7292f91c4d82df4fb012102a02dd7e4e970441ca09a05924612a669e1c6ee5b780e3949cfc8501d9ba2ea05014192e1920132314419f37431bb1e59685f4c86e90647884395fe895103f4f96102b673bba48e531248d398136757af371174ae00210e904c6eacb0b6f37e701751830247304402206443cf67c92448998236fe726ab94c0b47441d15748cb1bf06216c4625b162dc02201a0a2101994ee1f55b24a3310165696cce8f8ff01103db6b49a245239e288dab012102fcca882afeb75330a5b30db60619c675b43ff4cc9db71a1494524304e09d30330247304402204d08d34189759ae161d07c219efb99cf3602ff2d69314c54098ad1562ddae9440220109e082fb099783c01ac7b607565a462f988491c88b14ed3ec7cae7273cc4779012102a02dd7e4e970441ca09a05924612a669e1c6ee5b780e3949cfc8501d9ba2ea0500000000',
    //         from: '0x5120c2ed9bc1edd290c28d00b8be0047588b3ea974e7647e3dba5aa58fc8fd87d1ff',
    //         'from-bal': '4000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'dlrd',
    //         to: '0x0014a9323dcddcdf4da26a976a86cd813f21828df2df',
    //         'to-bal': '64000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0f32067f3cbd796b74a1105c3b9599ea97150b861ba2888fd010000000000000000000b1abab62b75a0a32a2d06f4ee371318791177efe9deacb6e612385e39ba3902941e0e657fed0417b88287fe',
    //         height: '808898n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0xe90ca2085d8282586da5e3c7306c11451a2aac54bbfbce021dca15945cc4fc6f',
    //           '0x45dbd44af9311c8ad3d5ac51baf83ea81cf78bd2658a68871fe174dd2fb85cb4',
    //           '0x3fc2e54094eb55da84f2ac56394fe9ea6c43a402f61c3bf1c7eadd0e736ad5b1',
    //           '0x6c62ef7bfea88e6cfed2db2a7b47e4cd8bbe6251b745b2e68196418d3e16b77e',
    //           '0x3d44c27668b58fb989fc743498b586216d469d6f644abfee6b43f77b7c01e2ac',
    //           '0xb6a4fe47406b0a1248c8ec562d9f338583493d679dec7f298cb7f8c19cc8593f',
    //           '0x573b16054ff3236a60e62b2ad27176cbf57f41cfe35e14a9a32920098a6eb436',
    //           '0xdeeb4ebafe99969856e00f39059c83b13edac414e2b57d852ae4e9ecbc6a938b',
    //           '0x3cfbd9146caf922946ce9c584e1a4140969542bae10eb0465a1e5b1cd4d3133d',
    //           '0xcfcef05a0bebd00f350dc6fb0cfa680d05fd10aa62eb4cd602943392b0417ff7',
    //           '0xd66b63dcc02752068629bb4e3cbeb531d4259bd5488f5f72e93025ffcfe3f4f3',
    //           '0xd46e863fc796618f9f43bc4b3983e4d23490ebd3bf8357f2b22e6740589d8bf3',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '393n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x7d7b5421c1a13b07743fe49d0bed0764abba06f8b036af9af39e6708db327a645fbc1402e96bcf14683a9d9b327490874404130f5d2f4c6216708f3df1be278701',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x7969f7801164d24d3038043ac6be9452f5a6c7be963143f4a6458e3324aeac79',
    //         },
    //       ],
    //       tx: {
    //         amt: '1000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000105de9ca13e574ed828eaa7a1839c6f99a79c2caa675aa71e2dcbdce35c2b23d6390500000000ffffffffde9ca13e574ed828eaa7a1839c6f99a79c2caa675aa71e2dcbdce35c2b23d6390600000000ffffffff9e201f1d98204dd1ac8f1dff34d91f513dc80969d2f9cc35c98dc3a6a3cb658b0000000000ffffffff1842b1e00b55d3c7f6ed5fe52fcdcdca55542a853c9d216caf2f32942ab7b1c00400000000ffffffffde9ca13e574ed828eaa7a1839c6f99a79c2caa675aa71e2dcbdce35c2b23d6390000000000ffffffff065802000000000000160014c31f17b8b786b89ac418a27474c28180f3ef0f6f2202000000000000160014533f1d5f9fda01daeb462247356f118c01ed02a57011010000000000225120b3748ceb0c2fa9b2c9d28ceb89419dc93efe5322da9f119bdbc818c598914bd41b22080000000000160014533f1d5f9fda01daeb462247356f118c01ed02a52c01000000000000160014c31f17b8b786b89ac418a27474c28180f3ef0f6f2c01000000000000160014c31f17b8b786b89ac418a27474c28180f3ef0f6f02483045022100fcbf5f291c436f18e6e00f87feb95692c0b273b9c859b67c0ea88da01175c63202202e025075c53ea91be547571222de0082d78fd346e92ec2436adbf481221f9f7a012102b2009ec413aafaa7c677652c49c916cf6d518537e86f247cf0c6bed4f8c9b1260247304402201b4e23abc5513db1fcc0cd9fefc579c1ad078afc3bc258fb04cb82149a77ab7802203b3280c24e2daef49f103b5e0fc9c32c2637b4ab303f1d59e08cbba3c67596a4012102b2009ec413aafaa7c677652c49c916cf6d518537e86f247cf0c6bed4f8c9b1260141a43a489e12a18231e04f0b8b4c919f4c6e9b56fd0989ee6f74dfc6e8528bc4bec1bfe5dd0242bbd5c4dcc852150157cd7e719a109b4989bbc6b9d55601c18ca8830248304502210086be7f1803193227094d1200884f5c0a83d68ac0268bb9e449c5f529107671de0220357ef0db4babeb295c23d6ab91075c495c5f23b81e66f9537a691dcda74ee89f012102204a507be67c5854f04c4d6549bf7bfe308188baca52521dec86bc587b0d93680247304402205f878dd983676dbb6d3d522b88d6bd86fecefe7ecf8b769453b761cd94ad370102201b83782d0260c7670cfc8ffe470e001ee57c23ba5916ddbb445b9775eb06ea08012102b2009ec413aafaa7c677652c49c916cf6d518537e86f247cf0c6bed4f8c9b12600000000',
    //         from: '0x5120b3748ceb0c2fa9b2c9d28ceb89419dc93efe5322da9f119bdbc818c598914bd4',
    //         'from-bal': '32000000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x0014533f1d5f9fda01daeb462247356f118c01ed02a5',
    //         'to-bal': '2200000000000000000000000000n',
    //       },
    //     },
    //     {
    //       block: {
    //         header:
    //           '0x00e0f32067f3cbd796b74a1105c3b9599ea97150b861ba2888fd010000000000000000000b1abab62b75a0a32a2d06f4ee371318791177efe9deacb6e612385e39ba3902941e0e657fed0417b88287fe',
    //         height: '808898n',
    //       },
    //       proof: {
    //         hashes: [
    //           '0x52d3cd73e2e32c7d06d92f56c40acf0d2374ae891647323e2f09edf85b11680e',
    //           '0x962934e0bae3692015da1a1ea6850dac63df580cc9501175aa0b2a77d339ec79',
    //           '0x964e4dfd966b74dbae128f246caa53f1828f19136aadbda7449ed3b04aa8e366',
    //           '0x34c6717e391d4584c67a9b1d6995a3bd7544d1991f6a9132ab54c2723b74cee9',
    //           '0x9aadfcdb304eaba52f367b7490c1da44394eb897c909a9f01b832f8744064416',
    //           '0xd5f41374ec8ea56c075ecd7abc3190c23d3c58b75dc740a53a8c0cbce0c159b9',
    //           '0xc0a642c7680bc5ee3bf5385ea6840dabb0382598d125b4a68e2203b67d5a7041',
    //           '0x4bca9ba09c13f9d95435e7e8fbe6feae65117aecb64dfcd8f995ec4d1320a969',
    //           '0xb9099a1d73e8b86db79a8cbfed60d478dbff74558ae16ec6edbe061bf7602192',
    //           '0xcfcef05a0bebd00f350dc6fb0cfa680d05fd10aa62eb4cd602943392b0417ff7',
    //           '0xd66b63dcc02752068629bb4e3cbeb531d4259bd5488f5f72e93025ffcfe3f4f3',
    //           '0xd46e863fc796618f9f43bc4b3983e4d23490ebd3bf8357f2b22e6740589d8bf3',
    //         ],
    //         'tree-depth': '12n',
    //         'tx-index': '220n',
    //       },
    //       'signature-packs': [
    //         {
    //           signature:
    //             '0x8755b292f855868fd02d70e8020810d7bd0050453a585ece5bada9d0d1797a4458db285150517f5caa96362b9282d5e1e8467581363e59bf5f2b5171e1a2e3fe01',
    //           signer: 'SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217',
    //           'tx-hash':
    //             '0x2023337a3850eafef401aa1d0c015be16e5d3e6f91f37bf362e06e774f375cae',
    //         },
    //       ],
    //       tx: {
    //         amt: '10000000000000000000000000000n',
    //         'bitcoin-tx':
    //           '0x02000000000105e6dfd1d72dcb7825f12f3e6856f8cb29e40fcb16bc87ee945ac223b63dc830cc0400000000ffffffffe6dfd1d72dcb7825f12f3e6856f8cb29e40fcb16bc87ee945ac223b63dc830cc0500000000ffffffffec6199083eefbcd72ee359525ffd3efd1337114445aaf390443a2949857ae3db0000000000ffffffff017932413323040097cc67809167e2e1e03076cb579a0f4582a9c94adc34126f0300000000ffffffffe6dfd1d72dcb7825f12f3e6856f8cb29e40fcb16bc87ee945ac223b63dc830cc0000000000ffffffff0758020000000000001600140bb18ca212d47f73df8f7fc187ef53fe90af13ab220200000000000022512045026cd75432fa2919f278ccdfb0badadf482314fed37910500a9d9a46e3d99190b20800000000001600143e8aab08d45473690c9914a6682172fc13c43befd0110000000000001600147d8432f3b7b132238a060d3c1462010d77f78c2df7ed14000000000022512045026cd75432fa2919f278ccdfb0badadf482314fed37910500a9d9a46e3d9912c010000000000001600140bb18ca212d47f73df8f7fc187ef53fe90af13ab2c010000000000001600140bb18ca212d47f73df8f7fc187ef53fe90af13ab02473044022100c4c79adb13299e6b836f31d144f1166e87d2902a7c459b2616eeae888d89141c021f7040b45eb869911410b0b5405bafaf57d651831f337106b39d7baf95db569401210236727c616bc1ec37eac5958813cd872802ddc5ab085dc005cb384b3452327ac00247304402200b9da73e6887fa636d171e144f415d1db982ce219a3d8083dbbc4211487a951b02200de1c95077ffea2703d9df17ff9a7752fac0204653e07a9a2eed606fd4255d3101210236727c616bc1ec37eac5958813cd872802ddc5ab085dc005cb384b3452327ac002473044022042fde4548bda084a9bf160c1c96510086131671b4b43e3d4db7fa6aafe6dcc8702206ed22b73b356887b80638bb5ae4e5cfbb610763d75fbc36d770fbd20be19465e83210378dbb0eb137ff469f58799f10f70ed2fc3007cc0a22316eac42413efe9008bc501403660aed197b668299aec289272edc3bd5394235df04efd27a0f2186c57fa391610e9d9a59e9bde18c77c4e67c8e776ef426be19e2c9e5d1610d2be4abafcd627024730440220188390074ad4b57c6961512cd4088b09cdb0a2bfd1c27cc8e8391cf173dda4b602203268587b54bc8f579e1fd90425f8ff73e6fb172b56c902d4cc7defbfb0a8452201210236727c616bc1ec37eac5958813cd872802ddc5ab085dc005cb384b3452327ac000000000',
    //         from: '0x00143e8aab08d45473690c9914a6682172fc13c43bef',
    //         'from-bal': '20000000000000000000000000000n',
    //         offset: '0n',
    //         output: '1n',
    //         tick: 'sats',
    //         to: '0x512045026cd75432fa2919f278ccdfb0badadf482314fed37910500a9d9a46e3d991',
    //         'to-bal': '17399999974000000000000000000n',
    //       },
    //     },
    //   ];

    //   block = chain.mineBlock(
    //     rawData.map((e: any) =>
    //       Tx.contractCall(
    //         'clarity-bitcoin',
    //         'mock-add-burnchain-block-header-hash',
    //         [
    //           trimUintCV(e['block']['height']),
    //           chain.callReadOnlyFn(
    //             'clarity-bitcoin',
    //             'get-txid',
    //             [buff(e['block']['header'])],
    //             deployer.address,
    //           ).result,
    //         ],
    //         deployer.address,
    //       ),
    //     ),
    //   );
    //   block.receipts.map((e: any) => {
    //     e.result.expectOk();
    //   });

    //   console.log(`processing ${rawData.length} tx`);
    //   for (let i = 0; i < rawData.length; i++) {
    //     const header0 = rawData[i]['block'];
    //     const proof0 = rawData[i]['proof'];
    //     const tx0 = rawData[i]['tx'];
    //     const signPack0 = rawData[i]['signature-packs'];

    //     const isSegwit =
    //       chain
    //         .callReadOnlyFn(
    //           'clarity-bitcoin',
    //           'is-segwit-tx',
    //           [buff(tx0['bitcoin-tx'])],
    //           deployer.address,
    //         )
    //         .result.expectOk() === 'true';
    //     console.log(`rawData[${i}] is a segwit tx? ${isSegwit}`);

    //     chain
    //       .callReadOnlyFn(
    //         'clarity-bitcoin',
    //         isSegwit ? 'parse-wtx' : 'parse-tx',
    //         [buff(tx0['bitcoin-tx'])],
    //         deployer.address,
    //       )
    //       .result.expectOk();

    //     console.log(
    //       `rawData[${i}] reversed-txid? ${
    //         chain.callReadOnlyFn(
    //           'clarity-bitcoin',
    //           isSegwit ? 'get-reversed-segwit-txid' : 'get-reversed-txid',
    //           [buff(tx0['bitcoin-tx'])],
    //           deployer.address,
    //         ).result
    //       }`,
    //     );

    //     console.log(
    //       `rawData[${i}] txid? ${
    //         chain.callReadOnlyFn(
    //           'clarity-bitcoin',
    //           isSegwit ? 'get-segwit-txid' : 'get-txid',
    //           [buff(tx0['bitcoin-tx'])],
    //           deployer.address,
    //         ).result
    //       }`,
    //     );

    //     console.log(
    //       `rawData[${i}] mined? ${chain
    //         .callReadOnlyFn(
    //           'clarity-bitcoin',
    //           isSegwit ? 'was-segwit-tx-mined?' : 'was-tx-mined?',
    //           [
    //             headerToTupleCV(header0),
    //             buff(tx0['bitcoin-tx']),
    //             proofToTupleCV(proof0),
    //           ],
    //           deployer.address,
    //         )
    //         .result.expectOk()}`,
    //     );

    //     block = chain.mineBlock([
    //       Tx.contractCall(
    //         'indexer',
    //         'index-tx-many',
    //         [
    //           types.list([
    //             types.tuple({
    //               tx: txToTupleCV(tx0),
    //               block: headerToTupleCV(header0),
    //               proof: proofToTupleCV(proof0),
    //               'signature-packs': types.list(
    //                 signPack0.map((e: any) => signPackToTupleCV(e)),
    //               ),
    //             }),
    //           ]),
    //         ],
    //         relayer.address,
    //       ),
    //     ]);
    //     block.receipts.map((e: any) => {
    //       console.log(`rawData[${i}] indexed ${e.result.expectOk()}`);
    //     });
    //   }
  },
});
