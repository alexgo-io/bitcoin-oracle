path "auth/approle/role/bitcoin-oracle-indexer-role/role-id" {
  capabilities = ["read"]
}

path "auth/approle/role/bitcoin-oracle-indexer-role/secret-id/lookup" {
  capabilities = ["update"]
}
