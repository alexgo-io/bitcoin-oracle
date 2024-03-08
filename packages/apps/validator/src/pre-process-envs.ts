import process from 'process';

function preprocessEnvs() {
  process.env['VAULT_ROLE_NAME'] = 'bitcoin-oracle-validator-role';
  if (
    process.env['VAULT_ROLE_ID_VALIDATOR'] != null &&
    process.env['VAULT_ROLE_ID_VALIDATOR'].length > 0
  ) {
    if (process.env['VAULT_ROLE_ID'] == null) {
      process.env['VAULT_ROLE_ID'] = process.env['VAULT_ROLE_ID_VALIDATOR'];
    } else {
      if (
        process.env['VAULT_ROLE_ID'] != process.env['VAULT_ROLE_ID_VALIDATOR']
      ) {
        throw new Error(
          'VAULT_ROLE_ID and VAULT_ROLE_ID_VALIDATOR are different and both are set. Please set only one of them.',
        );
      }
    }
  }

  if (
    process.env['VAULT_SECRET_ID_VALIDATOR'] != null &&
    process.env['VAULT_SECRET_ID_VALIDATOR'].length > 0
  ) {
    if (process.env['VAULT_SECRET_ID'] == null) {
      process.env['VAULT_SECRET_ID'] = process.env['VAULT_SECRET_ID_VALIDATOR'];
    } else {
      if (
        process.env['VAULT_SECRET_ID'] !=
        process.env['VAULT_SECRET_ID_VALIDATOR']
      ) {
        throw new Error(
          'VAULT_SECRET_ID and VAULT_SECRET_ID_VALIDATOR are different and both are set. Please set only one of them.',
        );
      }
    }
  }
}

preprocessEnvs();
