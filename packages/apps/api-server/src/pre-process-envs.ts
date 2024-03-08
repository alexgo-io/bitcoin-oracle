import process from 'process';

function preprocessEnvs() {
  process.env['VAULT_ROLE_NAME'] = 'bitcoin-oracle-api-server-role';
  if (
    process.env['VAULT_ROLE_ID_API_SERVER'] != null &&
    process.env['VAULT_ROLE_ID_API_SERVER'].length > 0
  ) {
    if (process.env['VAULT_ROLE_ID'] == null) {
      process.env['VAULT_ROLE_ID'] = process.env['VAULT_ROLE_ID_API_SERVER'];
    } else {
      if (
        process.env['VAULT_ROLE_ID'] != process.env['VAULT_ROLE_ID_API_SERVER']
      ) {
        throw new Error(
          'VAULT_ROLE_ID and VAULT_ROLE_ID_API_SERVER are different and both are set. Please set only one of them.',
        );
      }
    }
  }

  if (
    process.env['VAULT_SECRET_ID_API_SERVER'] != null &&
    process.env['VAULT_SECRET_ID_API_SERVER'].length > 0
  ) {
    if (process.env['VAULT_SECRET_ID'] == null) {
      process.env['VAULT_SECRET_ID'] =
        process.env['VAULT_SECRET_ID_API_SERVER'];
    } else {
      if (
        process.env['VAULT_SECRET_ID'] !=
        process.env['VAULT_SECRET_ID_API_SERVER']
      ) {
        throw new Error(
          'VAULT_SECRET_ID and VAULT_SECRET_ID_API_SERVER are different and both are set. Please set only one of them.',
        );
      }
    }
  }
}

preprocessEnvs();
