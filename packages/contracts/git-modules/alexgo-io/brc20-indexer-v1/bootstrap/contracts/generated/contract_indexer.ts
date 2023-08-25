
import {
defineContract,
bufferT,
principalT,
responseSimpleT,
numberT,
booleanT,
listT,
tupleT,
stringT,
optionalT,
noneT
} from "clarity-codegen"

export const indexer = defineContract({
"indexer": {
  'add-validator': {
    input: [
      { name: 'validator-pubkey', type: bufferT },
      { name: 'validator', type: principalT }
    ],
    output: responseSimpleT(numberT, ),
    mode: 'public'
  },
  'approve-relayer': {
    input: [
      { name: 'relayer', type: principalT },
      { name: 'approved', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'index-tx-many': {
    input: [
      {
        name: 'tx-many',
        type: listT(tupleT({
          block: tupleT({ header: bufferT, height: numberT }, ),
          proof: tupleT({
            hashes: listT(bufferT, ),
            'tree-depth': numberT,
            'tx-index': numberT
          }, ),
          'signature-packs': listT(tupleT({ signature: bufferT, signer: principalT, 'tx-hash': bufferT }, ), ),
          tx: tupleT({
            amt: numberT,
            'bitcoin-tx': bufferT,
            from: bufferT,
            'from-bal': numberT,
            output: numberT,
            tick: stringT,
            to: bufferT,
            'to-bal': numberT
          }, )
        }, ), )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'remove-validator': {
    input: [ { name: 'validator', type: principalT } ],
    output: responseSimpleT(numberT, ),
    mode: 'public'
  },
  'set-contract-owner': {
    input: [ { name: 'owner', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-paused': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-required-validators': {
    input: [ { name: 'new-required-validators', type: numberT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-user-balance': {
    input: [
      { name: 'user', type: bufferT },
      { name: 'tick', type: stringT },
      { name: 'amt', type: numberT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'get-bitcoin-tx-indexed-or-fail': {
    input: [
      { name: 'bitcoin-tx', type: bufferT },
      { name: 'output', type: numberT }
    ],
    output: responseSimpleT(tupleT({ amt: numberT, from: bufferT, tick: stringT, to: bufferT }, ), ),
    mode: 'readonly'
  },
  'get-contract-owner': { input: [], output: principalT, mode: 'readonly' },
  'get-paused': { input: [], output: booleanT, mode: 'readonly' },
  'get-required-validators': { input: [], output: numberT, mode: 'readonly' },
  'get-user-balance-or-default': {
    input: [
      { name: 'user', type: bufferT },
      { name: 'tick', type: stringT }
    ],
    output: numberT,
    mode: 'readonly'
  },
  'get-validator-or-fail': {
    input: [ { name: 'validator', type: principalT } ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'hash-tx': {
    input: [
      {
        name: 'tx',
        type: tupleT({
          amt: numberT,
          'bitcoin-tx': bufferT,
          from: bufferT,
          'from-bal': numberT,
          output: numberT,
          tick: stringT,
          to: bufferT,
          'to-bal': numberT
        }, )
      }
    ],
    output: bufferT,
    mode: 'readonly'
  },
  'validate-tx': {
    input: [
      { name: 'tx-hash', type: bufferT },
      {
        name: 'signature-pack',
        type: tupleT({ signature: bufferT, signer: principalT, 'tx-hash': bufferT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'verify-mined': {
    input: [
      { name: 'tx', type: bufferT },
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: numberT }, )
      },
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
  'approved-relayers': {
    input: principalT,
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'bitcoin-tx-indexed': {
    input: tupleT({ output: numberT, 'tx-hash': bufferT }, ),
    output: optionalT(tupleT({ amt: numberT, from: bufferT, tick: stringT, to: bufferT }, ), ),
    mode: 'mapEntry'
  },
  'tx-validated-by': {
    input: tupleT({ 'tx-hash': bufferT, validator: principalT }, ),
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'user-balance': {
    input: tupleT({ tick: stringT, user: bufferT }, ),
    output: optionalT(numberT, ),
    mode: 'mapEntry'
  },
  validators: { input: principalT, output: optionalT(bufferT, ), mode: 'mapEntry' },
  'contract-owner': { input: noneT, output: principalT, mode: 'variable' },
  'is-paused': { input: noneT, output: booleanT, mode: 'variable' },
  'required-validators': { input: noneT, output: numberT, mode: 'variable' },
  'tx-hash-to-iter': { input: noneT, output: bufferT, mode: 'variable' },
  'validator-count': { input: noneT, output: numberT, mode: 'variable' }
}
} as const)


