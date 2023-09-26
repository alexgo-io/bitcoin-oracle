
import {
defineContract,
uintT,
bufferT,
responseSimpleT,
booleanT,
optionalT,
tupleT,
listT
} from "clarity-codegen"

export const clarityBitcoin = defineContract({
"clarity-bitcoin": {
  'mock-add-burnchain-block-header-hash': {
    input: [
      { name: 'burn-height', type: uintT },
      { name: 'hash', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'get-bc-h-hash': {
    input: [ { name: 'bh', type: uintT } ],
    output: optionalT(bufferT, ),
    mode: 'readonly'
  },
  'get-reversed-segwit-txid': {
    input: [ { name: 'tx', type: bufferT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'get-reversed-txid': {
    input: [ { name: 'tx', type: bufferT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'get-segwit-txid': {
    input: [ { name: 'tx', type: bufferT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'get-txid': {
    input: [ { name: 'tx', type: bufferT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'inner-merkle-proof-verify': {
    input: [
      { name: 'ctr', type: uintT },
      {
        name: 'state',
        type: tupleT({
          'cur-hash': bufferT,
          path: uintT,
          'proof-hashes': listT(bufferT, ),
          'root-hash': bufferT,
          'tree-depth': uintT,
          verified: booleanT
        }, )
      }
    ],
    output: tupleT({
      'cur-hash': bufferT,
      path: uintT,
      'proof-hashes': listT(bufferT, ),
      'root-hash': bufferT,
      'tree-depth': uintT,
      verified: booleanT
    }, ),
    mode: 'readonly'
  },
  'inner-reverse': {
    input: [
      { name: 'target-index', type: uintT },
      { name: 'hash-input', type: bufferT }
    ],
    output: bufferT,
    mode: 'readonly'
  },
  'is-bit-set': {
    input: [ { name: 'val', type: uintT }, { name: 'bit', type: uintT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'parse-block-header': {
    input: [ { name: 'headerbuff', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'merkle-root': bufferT,
      nbits: uintT,
      nonce: uintT,
      parent: bufferT,
      timestamp: uintT,
      version: uintT
    }, ), ),
    mode: 'readonly'
  },
  'parse-tx': {
    input: [ { name: 'tx', type: bufferT } ],
    output: responseSimpleT(tupleT({
      ins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: uintT }, ),
        scriptSig: bufferT,
        sequence: uintT
      }, ), ),
      locktime: uintT,
      outs: listT(tupleT({ scriptPubKey: bufferT, value: uintT }, ), ),
      version: uintT
    }, ), ),
    mode: 'readonly'
  },
  'parse-wtx': {
    input: [ { name: 'tx', type: bufferT } ],
    output: responseSimpleT(tupleT({
      ins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: uintT }, ),
        scriptSig: bufferT,
        sequence: uintT
      }, ), ),
      locktime: uintT,
      outs: listT(tupleT({ scriptPubKey: bufferT, value: uintT }, ), ),
      'segwit-marker': uintT,
      'segwit-version': uintT,
      version: uintT,
      witnesses: listT(listT(bufferT, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-hashslice': {
    input: [
      {
        name: 'old-ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      hashslice: bufferT
    }, ), ),
    mode: 'readonly'
  },
  'read-next-element': {
    input: [
      { name: 'ignored', type: booleanT },
      {
        name: 'state-res',
        type: responseSimpleT(tupleT({
          ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
          elements: listT(bufferT, )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      elements: listT(bufferT, )
    }, ), ),
    mode: 'readonly'
  },
  'read-next-txin': {
    input: [
      { name: 'ignored', type: booleanT },
      {
        name: 'state-res',
        type: responseSimpleT(tupleT({
          ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
          remaining: uintT,
          txins: listT(tupleT({
            outpoint: tupleT({ hash: bufferT, index: uintT }, ),
            scriptSig: bufferT,
            sequence: uintT
          }, ), )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      remaining: uintT,
      txins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: uintT }, ),
        scriptSig: bufferT,
        sequence: uintT
      }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-next-txout': {
    input: [
      { name: 'ignored', type: booleanT },
      {
        name: 'state-res',
        type: responseSimpleT(tupleT({
          ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
          txouts: listT(tupleT({ scriptPubKey: bufferT, value: uintT }, ), )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      txouts: listT(tupleT({ scriptPubKey: bufferT, value: uintT }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-next-witness': {
    input: [
      { name: 'ignored', type: booleanT },
      {
        name: 'state-res',
        type: responseSimpleT(tupleT({
          ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
          witnesses: listT(listT(bufferT, ), )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      witnesses: listT(listT(bufferT, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-txins': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      remaining: uintT,
      txins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: uintT }, ),
        scriptSig: bufferT,
        sequence: uintT
      }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-txouts': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      txouts: listT(tupleT({ scriptPubKey: bufferT, value: uintT }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-uint16': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: uintT, txbuff: bufferT }, ), uint16: uintT }, ), ),
    mode: 'readonly'
  },
  'read-uint32': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: uintT, txbuff: bufferT }, ), uint32: uintT }, ), ),
    mode: 'readonly'
  },
  'read-uint64': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: uintT, txbuff: bufferT }, ), uint64: uintT }, ), ),
    mode: 'readonly'
  },
  'read-uint8': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: uintT, txbuff: bufferT }, ), uint8: uintT }, ), ),
    mode: 'readonly'
  },
  'read-varint': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: uintT, txbuff: bufferT }, ), varint: uintT }, ), ),
    mode: 'readonly'
  },
  'read-varslice': {
    input: [
      {
        name: 'old-ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: uintT, txbuff: bufferT }, ), varslice: bufferT }, ), ),
    mode: 'readonly'
  },
  'read-witnesses': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: uintT, txbuff: bufferT }, )
      },
      { name: 'num-txins', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: uintT, txbuff: bufferT }, ),
      witnesses: listT(listT(bufferT, ), )
    }, ), ),
    mode: 'readonly'
  },
  'reverse-buff32': {
    input: [ { name: 'input', type: bufferT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'verify-block-header': {
    input: [
      { name: 'headerbuff', type: bufferT },
      { name: 'expected-block-height', type: uintT }
    ],
    output: booleanT,
    mode: 'readonly'
  },
  'verify-merkle-proof': {
    input: [
      { name: 'reversed-txid', type: bufferT },
      { name: 'merkle-root', type: bufferT },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'was-segwit-tx-mined?': {
    input: [
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      { name: 'tx', type: bufferT },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'was-tx-mined?': {
    input: [
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      { name: 'tx', type: bufferT },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'mock-burnchain-header-hashes': { input: uintT, output: optionalT(bufferT, ), mode: 'mapEntry' }
}
} as const)


