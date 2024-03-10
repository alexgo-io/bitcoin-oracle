path "auth/approle/role/bitcoin-oracle-validator-role" {
  capabilities = ["read"]
}

path "auth/approle/role/bitcoin-oracle-validator-role/role-id" {
  capabilities = ["read"]
}

path "auth/approle/role/bitcoin-oracle-validator-role/secret-id/lookup" {
  capabilities = ["update"]
}

path "auth/approle/role/bitcoin-oracle-validator-role/secret-id-accessor/lookup" {
  capabilities = ["update"]
}
