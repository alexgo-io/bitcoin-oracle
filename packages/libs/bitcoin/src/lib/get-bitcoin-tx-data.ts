import { env } from '@alex-b20/env';
import ElectrumClient from 'electrum-client-sl';
import got from 'got-cjs';
import { bytesToHex, hexToBytes } from 'micro-stacks/common';
import { reverseBuffer } from './utils';

interface StacksBlockByHeight {
  header: string;
  prevBlocks: string[];
  stacksHeight: number;
}

export async function getCurrentStackNodeInfo() {
  return got(`${env.STACKS_MAINNET_API_URL}/v2/info`).json<{
    burn_block_height: number;
  }>();
}

export async function getCurrentBurnBlock() {
  return getCurrentStackNodeInfo().then(r => r['burn_block_height']);
}

export async function getStackNodeInfoByBurnHeight(burnHeight: number) {
  return got(
    `${env.STACKS_MAINNET_API_URL}/extended/v1/block/by_burn_block_height/${burnHeight}`,
  ).json<{ height: number }>();
}

export async function getStacksHeightByBurnHeight(burnHeight: number) {
  return getStackNodeInfoByBurnHeight(burnHeight).then(r => r['height']);
}

async function confirmationsToHeight(confirmations: number) {
  const curHeight = Number(await getCurrentBurnBlock());
  return curHeight - confirmations + 1;
}

export async function findStacksBlockAtHeight(
  height: number,
  prevBlocks: string[],
  electrumClient: ElectrumClient,
): Promise<StacksBlockByHeight> {
  const [header, stacksHeight] = await Promise.all([
    electrumClient.blockchain_block_header(height),
    getStacksHeightByBurnHeight(height),
  ]);
  if (typeof stacksHeight !== 'undefined') {
    return {
      header,
      prevBlocks,
      stacksHeight,
    };
  }
  prevBlocks.unshift(header);
  return findStacksBlockAtHeight(height + 1, prevBlocks, electrumClient);
}

export type BitcoinTxDataType = {
  burnHeight: number;
  tx: string;
  header: string;
  proof: { "tx-index": number; "tree-depth": number; hashes: string[] };
  height: number
}

export async function getBitcoinTxData(
  txId: string,
  electrumClient: ElectrumClient,
): Promise<BitcoinTxDataType> {
  const tx = await electrumClient.blockchain_transaction_get(txId, true);
  if (typeof tx.confirmations === 'undefined' || tx.confirmations < 1) {
    throw new Error('Tx is not confirmed');
  }

  const burnHeight = await confirmationsToHeight(tx.confirmations);
  const { header, stacksHeight, prevBlocks } = await findStacksBlockAtHeight(
    burnHeight,
    [],
    electrumClient,
  );

  const merkle = await electrumClient.blockchain_transaction_getMerkle(
    txId,
    burnHeight,
  );
  const merkleHashes = merkle.merkle.map((hash: any) => {
    return reverseBuffer(hexToBytes(hash));
  });

  const proofArg = {
    hashes: merkleHashes,
    txIndex: merkle.pos,
    treeDepth: merkleHashes.length,
  };

  const hashes = proofArg.hashes.map(h => bytesToHex(h));
  return {
    burnHeight: burnHeight,
    height: stacksHeight,
    tx: tx.hex,
    header: header,
    proof: {
      'tx-index': proofArg.txIndex,
      hashes,
      'tree-depth': proofArg.treeDepth,
    },
  };
}
