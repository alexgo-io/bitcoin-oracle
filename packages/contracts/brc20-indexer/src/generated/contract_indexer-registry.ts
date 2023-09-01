
import {
defineContract,
principalT,
booleanT,
responseSimpleT,
tupleT,
numberT,
bufferT,
stringT,
optionalT,
noneT
} from "../codegenImport"

export const indexerRegistry = defineContract({
"indexer-registry": {
  'approve-operator': {
    input: [
      { name: 'operator', type: principalT },
      { name: 'approved', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
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
  'set-tx-indexed': {
    input: [
      {
        name: 'key',
        type: tupleT({ output: numberT, 'tx-hash': bufferT }, )
      },
      {
        name: 'value',
        type: tupleT({ amt: numberT, from: bufferT, tick: stringT, to: bufferT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-tx-mined': {
    input: [
      { name: 'key', type: bufferT },
      { name: 'value', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-user-balance': {
    input: [
      { name: 'key', type: tupleT({ tick: stringT, user: bufferT }, ) },
      {
        name: 'value',
        type: tupleT({ balance: numberT, 'up-to-block': numberT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'get-approved-operator-or-default': {
    input: [ { name: 'operator', type: principalT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-bitcoin-tx-indexed-or-fail': {
    input: [
      { name: 'bitcoin-tx', type: bufferT },
      { name: 'output', type: numberT }
    ],
    output: responseSimpleT(tupleT({ amt: numberT, from: bufferT, tick: stringT, to: bufferT }, ), ),
    mode: 'readonly'
  },
  'get-bitcoin-tx-mined-or-default': {
    input: [ { name: 'tx', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-contract-owner': { input: [], output: principalT, mode: 'readonly' },
  'get-paused': { input: [], output: booleanT, mode: 'readonly' },
  'get-user-balance-or-default': {
    input: [
      { name: 'user', type: bufferT },
      { name: 'tick', type: stringT }
    ],
    output: tupleT({ balance: numberT, 'up-to-block': numberT }, ),
    mode: 'readonly'
  },
  'approved-operators': {
    input: principalT,
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'bitcoin-tx-indexed': {
    input: tupleT({ output: numberT, 'tx-hash': bufferT }, ),
    output: optionalT(tupleT({ amt: numberT, from: bufferT, tick: stringT, to: bufferT }, ), ),
    mode: 'mapEntry'
  },
  'bitcoin-tx-mined': { input: bufferT, output: optionalT(booleanT, ), mode: 'mapEntry' },
  'user-balance': {
    input: tupleT({ tick: stringT, user: bufferT }, ),
    output: optionalT(tupleT({ balance: numberT, 'up-to-block': numberT }, ), ),
    mode: 'mapEntry'
  },
  'contract-owner': { input: noneT, output: principalT, mode: 'variable' },
  'is-paused': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


