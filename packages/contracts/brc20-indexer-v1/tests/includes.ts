// deno-lint-ignore-file no-explicit-any ban-types
import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.3.1/index.ts";
export { assertEquals } from 'https://deno.land/std@0.166.0/testing/asserts.ts';
export { Clarinet, Tx, Chain, types };
export type { Account };
export { contractNames };
export { uintCV, principalCV, noneCV, someCV, tupleCV };

const contractNames = {
  indexer: 'indexer',
  registry: 'indexer-registry'
};

const uintCV = types.uint;
const principalCV = types.principal;
const noneCV = types.none;
const someCV = types.some;
const bufferCV = types.buff;
const tupleCV = types.tuple;
const boolCV = types.bool;
const stringUtf8CV = types.utf8;
const listCV = types.list;

export const trimUintCV = (input: string | number) =>
  typeof input === 'string'
    ? uintCV(input[input.length - 1] === 'n'
      ? input.substring(0, input.length - 1) : input)
    : uintCV(input)

export const buff = (input: string | ArrayBuffer) =>
  typeof input === 'string'
    ? input.length >= 2 && input[1] === 'x'
      ? input
      : `0x${input}`
    : bufferCV(input);

export function txPackToTuple(txPack: { [key: string]: any }) {
  const expected_struct = {
    tx: txToTupleCV,
    block: headerToTupleCV,
    proof: proofToTupleCV,
    "signature-packs": (input: any) => listCV(input.map((e: any) => signPackToTupleCV(e)))
  }
  const txPackTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in txPack) txPackTuple[key] = func(txPack[key]);
    else throw new Error(`TxPack object missing '${key}' field`);

  return txPackTuple;
}

export function txToTuple(tx: { [key: string]: any }) {
  const expected_struct = {
    'bitcoin-tx': (input: any) => buff(input),
    output: (input: any) => trimUintCV(input),
    offset: (input: any) => trimUintCV(input),
    tick: stringUtf8CV,
    amt: (input: any) => trimUintCV(input),
    from: (input: any) => buff(input),
    to: (input: any) => buff(input),
    'from-bal': (input: any) => trimUintCV(input),
    'to-bal': (input: any) => trimUintCV(input)
  };
  const txTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in tx) txTuple[key] = func(tx[key]);
    else throw new Error(`Tx object missing '${key}' field`);

  return txTuple;
}

export function txToTupleCV(tx: { [key: string]: any }) {
  return tupleCV(txToTuple(tx));
}

export function proofToTuple(proof: { [key: string]: any }) {
  const expected_struct = {
    hashes: (input: any) => listCV(input.map((e: any) => buff(e))),
    "tree-depth": (input: any) => trimUintCV(input),
    "tx-index": (input: any) => trimUintCV(input)
  }
  const proofTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in proof) proofTuple[key] = func(proof[key]);
    else throw new Error(`Proof object missing '${key}' field`);

  return proofTuple;
}

export function proofToTupleCV(proof: { [key: string]: any }) {
  return tupleCV(proofToTuple(proof));
}

export function headerToTuple(header: { [key: string]: any }) {
  const expected_struct = {
    header: (input: any) => buff(input),
    height: (input: any) => trimUintCV(input)
  }
  const headerTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in header) headerTuple[key] = func(header[key]);
    else throw new Error(`Header object missing '${key}' field`);

  return headerTuple;
}

export function headerToTupleCV(header: { [key: string]: any }) {
  return tupleCV(headerToTuple(header));
}

export function signPackToTuple(signPack: { [key: string]: any }) {
  const expected_struct = {
    "tx-hash": (input: any) => buff(input),
    signature: (input: any) => buff(input),
    signer: principalCV
  }
  const signPackTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in signPack) signPackTuple[key] = func(signPack[key]);
    else throw new Error(`SignPack object missing '${key}' field`);

  return signPackTuple;
}

export function signPackToTupleCV(signPack: { [key: string]: any }) {
  return tupleCV(signPackToTuple(signPack));
}

export function prepareChainBasicTest(
  chain: Chain,
  accounts: Map<string, Account>,
) {
  const deployer = accounts.get('deployer')!;
  const wallet_1 = accounts.get('wallet_1')!; //validator
  const wallet_2 = accounts.get('wallet_2')!; //relayer
  const wallet_3 = accounts.get('wallet_3')!; //relayer

  const wallet_1_pubkey =
    '03cd2cfdbd2ad9332828a7a13ef62cb999e063421c708e863a7ffed71fb61c88c9';
  const wallet_2_pubkey =
    '021843d01fa0bb9a3495fd2caf92505a81055dbe1fd545880fd40c3a1c7fd9c40a';
  const wallet_3_pubkey =
    '02c4b5eacb71a27be633ed970dcbc41c00440364bc04ba38ae4683ac24e708bf33';

  return chain.mineBlock([
    Tx.contractCall(
      "indexer-registry",
      "approve-operator",
      ['.' + contractNames.indexer, types.bool(true)],
      deployer.address
    ),
    Tx.contractCall(
      "indexer",
      "set-paused",
      [types.bool(false)],
      deployer.address
    ),
    Tx.contractCall(
      "indexer",
      "set-required-validators",
      [types.uint(1)],
      deployer.address
    ),
    Tx.contractCall(
      "indexer",
      "add-validator",
      [
        buff(wallet_1_pubkey),
        types.principal(wallet_1.address)
      ],
      deployer.address
    ),
    Tx.contractCall(
      "indexer",
      "approve-relayer",
      [
        types.principal(wallet_2.address),
        types.bool(true)
      ],
      deployer.address
    ),
    Tx.contractCall( // for live-testing
      "indexer",
      "add-validator",
      [
        buff('02883d08893252a59cf25aafffe1417bf74a7526621665a4bc0060e4aa95405891'),
        types.principal('SP1B0DHZV858RCBC8WG1YN5W9R491MJK88QPPC217')
      ],
      deployer.address
    ),
    Tx.contractCall( // for live-testing
      "indexer",
      "approve-relayer",
      [
        types.principal('SPMTYQTVWDH61Z0354KHD8EQQ36V8DX5R67P3DD0'),
        types.bool(true)
      ],
      deployer.address
    )
  ]);
}


