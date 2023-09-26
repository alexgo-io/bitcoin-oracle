import { defineContract } from "../codegenImport";
import { clarityBitcoin } from "./contract_clarity-bitcoin"
import { indexer } from "./contract_indexer"
import { indexerRegistry } from "./contract_indexer-registry"

export const indexerContracts = defineContract({
...clarityBitcoin,
...indexer,
...indexerRegistry
});

  