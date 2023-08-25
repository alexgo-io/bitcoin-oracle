
import {
defineContract,
bufferT,
numberT,
booleanT,
stringAsciiT
} from "../codegenImport"

export const utils = defineContract({
"utils": {
  'byte-to-uint': {
    input: [ { name: 'byte', type: bufferT } ],
    output: numberT,
    mode: 'readonly'
  },
  'serialize-bool': {
    input: [ { name: 'value', type: booleanT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'serialize-buff': {
    input: [ { name: 'value', type: bufferT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'serialize-string': {
    input: [ { name: 'value', type: stringAsciiT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'serialize-uint': {
    input: [ { name: 'value', type: numberT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'string-ascii-to-buff': {
    input: [ { name: 'str', type: stringAsciiT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'uint-to-byte': {
    input: [ { name: 'n', type: numberT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'uint128-to-buff-be': {
    input: [ { name: 'n', type: numberT } ],
    output: bufferT,
    mode: 'readonly'
  },
  'uint32-to-buff-be': {
    input: [ { name: 'n', type: numberT } ],
    output: bufferT,
    mode: 'readonly'
  }
}
} as const)


