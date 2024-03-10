import process from 'process';

function preprocessEnvs() {
  process.env['VAULT_ROLE_NAME'] = 'bitcoin-oracle-indexer-role';
  if (
    process.env['VAULT_ROLE_ID_INDEXER'] != null &&
    process.env['VAULT_ROLE_ID_INDEXER'].length > 0
  ) {
    if (process.env['VAULT_ROLE_ID'] == null) {
      process.env['VAULT_ROLE_ID'] = process.env['VAULT_ROLE_ID_INDEXER'];
    } else {
      if (
        process.env['VAULT_ROLE_ID'] != process.env['VAULT_ROLE_ID_INDEXER']
      ) {
        throw new Error(
          'VAULT_ROLE_ID and VAULT_ROLE_ID_INDEXER are different and both are set. Please set only one of them.',
        );
      }
    }
  }

  if (
    process.env['VAULT_SECRET_ID_INDEXER'] != null &&
    process.env['VAULT_SECRET_ID_INDEXER'].length > 0
  ) {
    if (process.env['VAULT_SECRET_ID'] == null) {
      process.env['VAULT_SECRET_ID'] = process.env['VAULT_SECRET_ID_INDEXER'];
    } else {
      if (
        process.env['VAULT_SECRET_ID'] != process.env['VAULT_SECRET_ID_INDEXER']
      ) {
        throw new Error(
          'VAULT_SECRET_ID and VAULT_SECRET_ID_INDEXER are different and both are set. Please set only one of them.',
        );
      }
    }
  }
}

preprocessEnvs();
