import { oracleRegistryV101 } from './contract_oracle-registry-v1-01';
import { oracleV104 } from './contract_oracle-v1-04';

export const OracleContracts = {
  ...oracleV104,
  ...oracleRegistryV101,
};
