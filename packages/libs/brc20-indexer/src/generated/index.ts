import * as oracleRegistry from './contract_oracle-registry-v1-01';
import * as oracle from './contract_oracle-v1-03';

export const OracleContracts = {
  'oracle-v1-03': oracle.oracleV103['oracle-v1-03'],
  'oracle-registry-v1-01':
    oracleRegistry.oracleRegistryV101['oracle-registry-v1-01'],
};
