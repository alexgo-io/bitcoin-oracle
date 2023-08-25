import { defineContract } from "clarity-codegen";
import { utils } from "./contract_utils"
import { clarityBitcoin } from "./contract_clarity-bitcoin"
import { indexer } from "./contract_indexer"

export const Brc20IndexerContracts = defineContract({
...utils,
...clarityBitcoin,
...indexer
});

  