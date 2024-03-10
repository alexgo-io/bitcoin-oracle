import process from 'process';

function preprocessEnvs() {
  process.env['VAULT_ROLE_NAME'] = 'bitcoin-oracle-relayer-role';
  if (
    process.env['VAULT_ROLE_ID_RELAYER'] != null &&
    process.env['VAULT_ROLE_ID_RELAYER'].length > 0
  ) {
    if (process.env['VAULT_ROLE_ID'] == null) {
      process.env['VAULT_ROLE_ID'] = process.env['VAULT_ROLE_ID_RELAYER'];
    } else {
      if (
        process.env['VAULT_ROLE_ID'] != process.env['VAULT_ROLE_ID_RELAYER']
      ) {
        throw new Error(
          'VAULT_ROLE_ID and VAULT_ROLE_ID_RELAYER are different and both are set. Please set only one of them.',
        );
      }
    }
  }

  if (
    process.env['VAULT_SECRET_ID_RELAYER'] != null &&
    process.env['VAULT_SECRET_ID_RELAYER'].length > 0
  ) {
    if (process.env['VAULT_SECRET_ID'] == null) {
      process.env['VAULT_SECRET_ID'] = process.env['VAULT_SECRET_ID_RELAYER'];
    } else {
      if (
        process.env['VAULT_SECRET_ID'] != process.env['VAULT_SECRET_ID_RELAYER']
      ) {
        throw new Error(
          'VAULT_SECRET_ID and VAULT_SECRET_ID_RELAYER are different and both are set. Please set only one of them.',
        );
      }
    }
  }
}

preprocessEnvs();
