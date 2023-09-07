import { defineContract } from "../codegenImport";
import { clarityBitcoin } from "./contract_clarity-bitcoin"
import { indexerDevPreview3 } from "./contract_indexer-dev-preview-3"
import { indexerRegistryDevPreview1 } from "./contract_indexer-registry-dev-preview-1"

export const indexerContracts = defineContract({
...clarityBitcoin,
...indexerDevPreview3,
...indexerRegistryDevPreview1
});

  