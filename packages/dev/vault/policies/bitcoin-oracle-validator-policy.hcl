path "auth/approle/role/bitcoin-oracle-validator-role/role-id" {
  capabilities = ["read"]
}

path "auth/approle/role/bitcoin-oracle-validator-role/secret-id/lookup" {
  capabilities = ["update"]
}
