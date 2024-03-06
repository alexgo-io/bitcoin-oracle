# To create an entity and entity alias. Enable and configure Vault as an OIDC provider
path "identity/*" {
  capabilities = [ "create", "read", "update", "delete", "list" ]
}

# To enable userpass auth method
path "sys/auth/userpass" {
  capabilities = [ "create", "read", "update", "delete" ]
}

# To create a new user, "end-user" for userpass
path "auth/userpass/users/*" {
  capabilities = [ "create", "read", "update", "delete", "list" ]
}
