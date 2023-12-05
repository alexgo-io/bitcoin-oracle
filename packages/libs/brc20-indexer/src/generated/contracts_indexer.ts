import { defineContract } from '../codegenImport';
import { clarityBitcoin } from './contract_clarity-bitcoin';
import { oracleRegistryV101 } from './contract_oracle-registry-v1-01';
import { oracleV102 } from './contract_oracle-v1-02';

export const indexerContracts = defineContract({
  ...clarityBitcoin,
  ...oracleRegistryV101,
  ...oracleV102,
});
