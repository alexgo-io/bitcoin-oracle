#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

// These are helper scripts to make development a little bit easier.
// DO NOT USE REAL SEED PHRASES OR PRIVATE KEYS.

import {
  bufferCV,
  serializeCV,
  tupleCV,
  uintCV,
  stringUtf8CV,
  standardPrincipalCV,
  contractPrincipalCV,
  TupleCV
} from '@stacks/transactions';
import { createHash } from 'crypto';

if (process.argv.length !== 3) {
  console.log(`Usage: ts-node generate-tx-hash <Order JSON>`);
  process.exit(0);
}

function principalCV(input: string) {
  const dot = input.indexOf('.');
  return dot === -1
    ? standardPrincipalCV(input)
    : contractPrincipalCV(input.substring(0, dot), input.substring(dot + 1));
}

function toBuffer(input: string): Buffer {
  return Buffer.from(
    input.length >= 2 && input[1] === 'x' ? input.substr(2) : input,
    'hex',
  );
}

function txToTupleCV(tx: { [key: string]: any }) {
  const expected_struct = {
    'bitcoin-tx': (input: any) => bufferCV(toBuffer(input)),
    output: uintCV,
    offset: uintCV,
    tick: stringUtf8CV,
    amt: uintCV,
    from: (input: any) => bufferCV(toBuffer(input)),
    to: (input: any) => bufferCV(toBuffer(input)),
    'from-bal': uintCV,
    'to-bal': uintCV
  };
  const txTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in tx) txTuple[key] = func(tx[key]);
    else throw new Error(`Tx object missing '${key}' field`);

  return tupleCV(txTuple);
}

const hashOrder = (tx: TupleCV) =>
  createHash('sha256').update(serializeCV(tx)).digest();

let tx;
try {
  tx = JSON.parse(process.argv[2]!);
} catch (error) {
  console.log('Invalid JSON');
  process.exit(1);
}

const txTuple = txToTupleCV(tx);
const hash = hashOrder(txTuple) as Buffer;
console.log(`Tx Hash: 0x${hash.toString('hex')}`);
