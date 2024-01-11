import {
  booleanT,
  bufferT,
  defineContract,
  noneT,
  optionalT,
  principalT,
  responseSimpleT,
  stringT,
  tupleT,
  uintT,
} from '../codegenImport';

export const oracleRegistryV102 = defineContract({
  'oracle-registry-v1-02': {
    'approve-operator': {
      input: [
        { name: 'operator', type: principalT },
        { name: 'approved', type: booleanT },
      ],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-contract-owner': {
      input: [{ name: 'owner', type: principalT }],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-contract-owner-legacy': {
      input: [{ name: 'owner', type: principalT }],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-paused': {
      input: [{ name: 'paused', type: booleanT }],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-paused-legacy': {
      input: [{ name: 'paused', type: booleanT }],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-tick-decimals': {
      input: [
        { name: 'tick', type: stringT },
        { name: 'decimals', type: uintT },
      ],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-tx-indexed': {
      input: [
        {
          name: 'key',
          type: tupleT({ offset: uintT, output: uintT, 'tx-hash': bufferT }),
        },
        {
          name: 'value',
          type: tupleT({
            amt: uintT,
            from: bufferT,
            tick: stringT,
            to: bufferT,
          }),
        },
      ],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-tx-mined': {
      input: [
        { name: 'key', type: bufferT },
        { name: 'value', type: uintT },
      ],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'set-user-balance': {
      input: [
        { name: 'key', type: tupleT({ tick: stringT, user: bufferT }) },
        {
          name: 'value',
          type: tupleT({ balance: uintT, 'up-to-block': uintT }),
        },
      ],
      output: responseSimpleT(booleanT),
      mode: 'public',
    },
    'get-approved-operator-or-default': {
      input: [{ name: 'operator', type: principalT }],
      output: booleanT,
      mode: 'readonly',
    },
    'get-bitcoin-tx-indexed-or-fail': {
      input: [
        { name: 'bitcoin-tx', type: bufferT },
        { name: 'output', type: uintT },
        { name: 'offset', type: uintT },
      ],
      output: responseSimpleT(
        tupleT({ amt: uintT, from: bufferT, tick: stringT, to: bufferT }),
      ),
      mode: 'readonly',
    },
    'get-bitcoin-tx-mined-or-fail': {
      input: [{ name: 'tx', type: bufferT }],
      output: responseSimpleT(uintT),
      mode: 'readonly',
    },
    'get-contract-owner': { input: [], output: principalT, mode: 'readonly' },
    'get-paused': { input: [], output: booleanT, mode: 'readonly' },
    'get-tick-decimals-or-default': {
      input: [{ name: 'tick', type: stringT }],
      output: uintT,
      mode: 'readonly',
    },
    'get-user-balance-or-default': {
      input: [
        { name: 'user', type: bufferT },
        { name: 'tick', type: stringT },
      ],
      output: tupleT({ balance: uintT, 'up-to-block': uintT }),
      mode: 'readonly',
    },
    'bitcoin-tx-indexed': {
      input: tupleT({ offset: uintT, output: uintT, 'tx-hash': bufferT }),
      output: optionalT(
        tupleT({ amt: uintT, from: bufferT, tick: stringT, to: bufferT }),
      ),
      mode: 'mapEntry',
    },
    'bitcoin-tx-mined': {
      input: bufferT,
      output: optionalT(uintT),
      mode: 'mapEntry',
    },
    'contract-owner': { input: noneT, output: principalT, mode: 'variable' },
    'is-paused': { input: noneT, output: booleanT, mode: 'variable' },
  },
} as const);
