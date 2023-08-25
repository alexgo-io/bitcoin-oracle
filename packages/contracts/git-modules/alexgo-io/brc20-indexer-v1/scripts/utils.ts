import { Address, OutScript } from "micro-btc-signer";
import { IntegerType, bytesToBigInt, intToBigInt as _intToBigInt } from "micro-stacks/common";
import BigNumber from "bignumber.js";
import { address as bAddress, networks, payments } from 'bitcoinjs-lib';
import { base58checkEncode, hashRipemd160 } from 'micro-stacks/crypto';
import { hashSha256 } from 'micro-stacks/crypto-sha';

export let btcNetwork: networks.Network;

// output == pkscript == scriptPubkey
export function addressToOutput(address: string) {
  const addr = Address().decode(address);
  return OutScript.encode(addr);
}

export function outputToAddress(output: Uint8Array) {
  return Address().encode(OutScript.decode(output));
}

/**
 * a188465951f549724ce1206d31efecacc93716a49dfb21081ac0076f291b1231i0
 * @param id
 */
export function decodeOrdId(id: string) {
  if (id.length !== 66) {
    throw new Error("Invalid Ord ID: expected 66 chars");
  }
  const txid = id.slice(0, 64);
  const idx = id.slice(65);
  return {
    txid,
    index: parseInt(idx, 10),
  };
}

export function reverseBuffer(buffer: Uint8Array): Uint8Array {
  if (buffer.length < 1) return buffer;
  let j = buffer.length - 1;
  let tmp = 0;
  for (let i = 0; i < buffer.length / 2; i++) {
    tmp = buffer[i];
    buffer[i] = buffer[j];
    buffer[j] = tmp;
    j--;
  }
  return Uint8Array.from(buffer);
}

export type IntegerOrBN = IntegerType | BigNumber;

export function intToString(int: IntegerOrBN) {
  const str = typeof int === "bigint" ? int.toString() : String(int);
  return str;
}

export function satsToBtc(sats: IntegerOrBN, minDecimals?: number) {
  const n = new BigNumber(intToString(sats)).shiftedBy(-8).decimalPlaces(8);
  if (typeof minDecimals === "undefined") return n.toFormat();
  const rounded = n.toFormat(minDecimals);
  const normal = n.toFormat();
  return rounded.length > normal.length ? rounded : normal;
}

export function btcToSatsBN(btc: IntegerOrBN) {
  return new BigNumber(intToString(btc)).shiftedBy(8).decimalPlaces(0);
}

export function stxToMicroStx(stx: number | string) {
  const n = new BigNumber(stx).shiftedBy(6).decimalPlaces(0);
  return n;
}

export function btcToSats(btc: IntegerOrBN) {
  return btcToSatsBN(btc).toString();
}

export const addressVersionToMainnetVersion: Record<number, number> = {
  [0]: 0,
  [5]: 5,
  [111]: 0,
  [196]: 5,
};

export function parseBtcAddress(address: string) {
  const b58 = bAddress.fromBase58Check(address);
  const version = addressVersionToMainnetVersion[b58.version] as number | undefined;
  if (typeof version !== 'number') throw new Error('Invalid address version.');
  return {
    version,
    hash: b58.hash,
  };
}

export function getBtcAddress(hash: Uint8Array, versionBytes: Uint8Array) {
  const version = Number(bytesToBigInt(versionBytes));
  const address = version === networks.bitcoin.pubKeyHash ? payments.p2pkh({ network: btcNetwork, hash: Buffer.from(hash) }) : payments.p2sh({ network: btcNetwork, hash: Buffer.from(hash) });
  if (!address) throw new Error('Invalid BTC payment');
  return address;
}

export function pubKeyToBtcAddress(publicKey: Uint8Array) {
  const sha256 = hashSha256(publicKey);
  const hash160 = hashRipemd160(sha256);
  return base58checkEncode(hash160, btcNetwork.pubKeyHash);
}

// Add 0x to beginning of txid
export function getTxId(txId: string) {
  return txId.startsWith('0x') ? txId : `0x${txId}`;
}

// const address = 'bc1pd80e66svaev7xqx2jjjpwrrl2c9k5vd3hnajakugff6facan8ukqfufh09';
// const pkscript = '512069df9d6a0cee59e300ca94a4170c7f560b6a31b1bcfb2edb884a749ee3b33f2c';
// console.log(outputToAddress(Uint8Array.from(Buffer.from(pkscript, 'hex'))), address);
// console.log(Buffer.from(addressToOutput(address)).toString('hex'), pkscript);
