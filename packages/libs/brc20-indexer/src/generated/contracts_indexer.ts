import { defineContract } from '../codegenImport';
import { clarityBitcoinV105 } from './contract_clarity-bitcoin-v1-05';
import { oracleRegistryV101 } from './contract_oracle-registry-v1-01';
import { oracleRegistryV102 } from './contract_oracle-registry-v1-02';
import { oracleV106 } from './contract_oracle-v1-06';

export const indexerContracts = defineContract({
  ...clarityBitcoinV105,
  ...oracleRegistryV101,
  ...oracleRegistryV102,
  ...oracleV106,
});
