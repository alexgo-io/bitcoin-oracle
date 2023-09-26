#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

// These are helper scripts to make development a little bit easier.
// DO NOT USE REAL SEED PHRASES OR PRIVATE KEYS.

import { ChainID, TransactionVersion } from '@stacks/common';
import { Wallet } from '@stacks/keychain';
import { pubKeyfromPrivKey, getAddressFromPublicKey } from '@stacks/transactions';

if (process.argv.length !== 3) {
  console.log(`Usage: ts-node seed-to-private-key "<seed phrase>"`);
  process.exit(0);
}

function bufferFromUint8Array(b: Uint8Array) {
  return Buffer.from(b, b.byteOffset, b.byteLength);
}

const mnemonic = String(process.argv[2]);

Wallet.restore('', mnemonic, ChainID.Testnet).then((wallet: any) => {
  const signer = wallet.getSigner();
  const privKey = signer.getSTXPrivateKey();
  const pubKey = pubKeyfromPrivKey(privKey).data;

  console.log('Seed phrase:     ' + mnemonic);
  console.log('private key:     ' + privKey.toString('hex'));
  console.log(
    'Mainnet address: ' + signer.getSTXAddress(TransactionVersion.Mainnet),
  );
  console.log(
    'Testnet address: ' + signer.getSTXAddress(TransactionVersion.Testnet),
  );
  console.log(
    'Public key:      ' + bufferFromUint8Array(pubKey).toString('hex'),
  );
  console.log(
    'Pubkey to Mainnet Address: ' + getAddressFromPublicKey(pubKey, TransactionVersion.Mainnet)
  );
  console.log(
    'Pubkey to Testnet Address: ' + getAddressFromPublicKey(pubKey, TransactionVersion.Testnet)
  );
});

