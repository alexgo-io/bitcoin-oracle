import { oracleRegistryV101 } from './contract_oracle-registry-v1-01';
import { oracleRegistryV102 } from './contract_oracle-registry-v1-02';
import { oracleV106 } from './contract_oracle-v1-06';

export const OracleContracts = {
  ...oracleV106,
  ...oracleRegistryV101,
  ...oracleRegistryV102,
};
