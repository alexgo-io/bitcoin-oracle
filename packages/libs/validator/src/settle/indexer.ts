import {indexerContracts} from "@alex-b20/brc20-indexer";

export type SettleParam = {
  block: {
    header: Buffer;
    height: bigint;
  },
  proof: {
    hashes: Buffer[];
    'tree-depth': bigint;
    'tx-index': bigint;
  },
}

const indexerIndexTxManyInput = indexerContracts['indexer']['index-tx-many']['input'][0]


export type IndexTxManyInput = Parameters<typeof indexerIndexTxManyInput.type.encode>[0]
export async function indexTxs(input: IndexTxManyInput) {
}
