
import {
defineContract,
numberT,
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
      { name: 'burn-height', type: numberT },
      { name: 'hash', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'get-bc-h-hash': {
    input: [ { name: 'bh', type: numberT } ],
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
      { name: 'ctr', type: numberT },
      {
        name: 'state',
        type: tupleT({
          'cur-hash': bufferT,
          path: numberT,
          'proof-hashes': listT(bufferT, ),
          'root-hash': bufferT,
          'tree-depth': numberT,
          verified: booleanT
        }, )
      }
    ],
    output: tupleT({
      'cur-hash': bufferT,
      path: numberT,
      'proof-hashes': listT(bufferT, ),
      'root-hash': bufferT,
      'tree-depth': numberT,
      verified: booleanT
    }, ),
    mode: 'readonly'
  },
  'inner-reverse': {
    input: [
      { name: 'target-index', type: numberT },
      { name: 'hash-input', type: bufferT }
    ],
    output: bufferT,
    mode: 'readonly'
  },
  'is-bit-set': {
    input: [ { name: 'val', type: numberT }, { name: 'bit', type: numberT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'parse-block-header': {
    input: [ { name: 'headerbuff', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'merkle-root': bufferT,
      nbits: numberT,
      nonce: numberT,
      parent: bufferT,
      timestamp: numberT,
      version: numberT
    }, ), ),
    mode: 'readonly'
  },
  'parse-tx': {
    input: [ { name: 'tx', type: bufferT } ],
    output: responseSimpleT(tupleT({
      ins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: numberT }, ),
        scriptSig: bufferT,
        sequence: numberT
      }, ), ),
      locktime: numberT,
      outs: listT(tupleT({ scriptPubKey: bufferT, value: numberT }, ), ),
      version: numberT
    }, ), ),
    mode: 'readonly'
  },
  'parse-wtx': {
    input: [ { name: 'tx', type: bufferT } ],
    output: responseSimpleT(tupleT({
      ins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: numberT }, ),
        scriptSig: bufferT,
        sequence: numberT
      }, ), ),
      locktime: numberT,
      outs: listT(tupleT({ scriptPubKey: bufferT, value: numberT }, ), ),
      'segwit-marker': numberT,
      'segwit-version': numberT,
      version: numberT,
      witnesses: listT(listT(bufferT, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-hashslice': {
    input: [
      {
        name: 'old-ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
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
          ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
          elements: listT(bufferT, )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
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
          ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
          remaining: numberT,
          txins: listT(tupleT({
            outpoint: tupleT({ hash: bufferT, index: numberT }, ),
            scriptSig: bufferT,
            sequence: numberT
          }, ), )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
      remaining: numberT,
      txins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: numberT }, ),
        scriptSig: bufferT,
        sequence: numberT
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
          ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
          txouts: listT(tupleT({ scriptPubKey: bufferT, value: numberT }, ), )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
      txouts: listT(tupleT({ scriptPubKey: bufferT, value: numberT }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-next-witness': {
    input: [
      { name: 'ignored', type: booleanT },
      {
        name: 'state-res',
        type: responseSimpleT(tupleT({
          ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
          witnesses: listT(listT(bufferT, ), )
        }, ), )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
      witnesses: listT(listT(bufferT, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-txins': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
      remaining: numberT,
      txins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: numberT }, ),
        scriptSig: bufferT,
        sequence: numberT
      }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-txouts': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
      txouts: listT(tupleT({ scriptPubKey: bufferT, value: numberT }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'read-uint16': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: numberT, txbuff: bufferT }, ), uint16: numberT }, ), ),
    mode: 'readonly'
  },
  'read-uint32': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: numberT, txbuff: bufferT }, ), uint32: numberT }, ), ),
    mode: 'readonly'
  },
  'read-uint64': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: numberT, txbuff: bufferT }, ), uint64: numberT }, ), ),
    mode: 'readonly'
  },
  'read-uint8': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: numberT, txbuff: bufferT }, ), uint8: numberT }, ), ),
    mode: 'readonly'
  },
  'read-varint': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({ ctx: tupleT({ index: numberT, txbuff: bufferT }, ), varint: numberT }, ), ),
    mode: 'readonly'
  },
  'read-varslice': {
    input: [
      {
        name: 'old-ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
      varslice: bufferT
    }, ), ),
    mode: 'readonly'
  },
  'read-witnesses': {
    input: [
      {
        name: 'ctx',
        type: tupleT({ index: numberT, txbuff: bufferT }, )
      },
      { name: 'num-txins', type: numberT }
    ],
    output: responseSimpleT(tupleT({
      ctx: tupleT({ index: numberT, txbuff: bufferT }, ),
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
      { name: 'expected-block-height', type: numberT }
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
        type: tupleT({
          hashes: listT(bufferT, ),
          'tree-depth': numberT,
          'tx-index': numberT
        }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'was-segwit-tx-mined?': {
    input: [
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: numberT }, )
      },
      { name: 'tx', type: bufferT },
      {
        name: 'proof',
        type: tupleT({
          hashes: listT(bufferT, ),
          'tree-depth': numberT,
          'tx-index': numberT
        }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'was-tx-mined?': {
    input: [
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: numberT }, )
      },
      { name: 'tx', type: bufferT },
      {
        name: 'proof',
        type: tupleT({
          hashes: listT(bufferT, ),
          'tree-depth': numberT,
          'tx-index': numberT
        }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'mock-burnchain-header-hashes': { input: numberT, output: optionalT(bufferT, ), mode: 'mapEntry' }
}
} as const)


