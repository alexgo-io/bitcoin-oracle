import { defineContract } from '../codegenImport';
import { clarityBitcoinV103 } from './contract_clarity-bitcoin-v1-03';
import { oracleRegistryV101 } from './contract_oracle-registry-v1-01';
import { oracleV104 } from './contract_oracle-v1-04';

export const indexerContracts = defineContract({
  ...clarityBitcoinV103,
  ...oracleRegistryV101,
  ...oracleV104,
});
