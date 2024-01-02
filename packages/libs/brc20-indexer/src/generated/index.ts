import * as oracleRegistry from './contract_oracle-registry-v1-01';
import * as oracle from './contract_oracle-v1-03';

export const OracleContracts = {
  ...oracle.oracleV103,
  ...oracleRegistry.oracleRegistryV101,
};
