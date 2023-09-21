import { defineContract } from "../codegenImport";
import { clarityBitcoin } from "./contract_clarity-bitcoin"
import { indexerDevPreview5 } from "./contract_indexer-dev-preview-5"
import { indexerRegistryDevPreview1 } from "./contract_indexer-registry-dev-preview-1"

export const indexerContracts = defineContract({
...clarityBitcoin,
...indexerDevPreview5,
...indexerRegistryDevPreview1
});

  