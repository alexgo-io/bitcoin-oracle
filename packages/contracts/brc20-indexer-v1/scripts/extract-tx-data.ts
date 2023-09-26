import ElectrumClient from "electrum-client-sl";
import { StacksMainnet } from "@stacks/network";
import { hexToBytes, bytesToHex } from "@stacks/common";
import { btcToSats, outputToAddress, reverseBuffer } from "./utils";
import { Transaction } from "micro-btc-signer";

export const network = new StacksMainnet();
export const STACKS_API_URL = "https://api.hiro.so"

export async function getCurrentStackNodeInfo() {
  return fetch(`${STACKS_API_URL}/v2/info`).then(r => r.json());
}

export async function getCurrentBurnBlock() {
  return getCurrentStackNodeInfo().then(r => r['burn_block_height']);
}

export async function getCurrentBlock() {
  return getCurrentStackNodeInfo().then(r => Number(r['stacks_tip_height'] + 1));
}

export async function getStackNodeInfoByBurnHeight(burnHeight: number) {
  return fetch(`${STACKS_API_URL}/extended/v1/block/by_burn_block_height/${burnHeight}`).then(r => r.json());
}

export async function getStacksHeightByBurnHeight(burnHeight: number) {
  return getStackNodeInfoByBurnHeight(burnHeight).then(r => r['height']);
}

export function getElectrumConfig() {
  return {
    host: "fortress.qtornado.com",
    port: 443,
    protocol: "ssl",
  };
}

export function getElectrumClient() {
  const electrumConfig = getElectrumConfig();
  return new ElectrumClient(
    electrumConfig.host,
    electrumConfig.port,
    electrumConfig.protocol
  );
}

export async function withElectrumClient<T = void>(
  cb: (client: ElectrumClient) => Promise<T>
): Promise<T> {
  const electrumClient = getElectrumClient();
  const client = electrumClient;
  await client.connect();
  try {
    const res = await cb(client);
    await client.close();
    return res;
  } catch (error) {
    console.error(`Error from withElectrumConfig`, error);
    await client.close();
    throw error;
  }
}

interface StacksBlockByHeight {
  header: string;
  prevBlocks: string[];
  stacksHeight: number;
}
export async function findStacksBlockAtHeight(
  height: number,
  prevBlocks: string[],
  electrumClient: ElectrumClient
): Promise<StacksBlockByHeight> {
  const [header, stacksHeight] = await Promise.all([
    electrumClient.blockchain_block_header(height),
    getStacksHeight(height),
  ]);
  if (typeof stacksHeight !== "undefined") {
    return {
      header,
      prevBlocks,
      stacksHeight,
    };
  }
  prevBlocks.unshift(header);
  return findStacksBlockAtHeight(height + 1, prevBlocks, electrumClient);
}

export async function getStacksHeight(burnHeight: number) {
  try {
    return await getStacksHeightByBurnHeight(burnHeight);
  } catch (error) {
    return undefined;
  }
}

export function getTxHex(hex: string) {
  const tx = Transaction.fromRaw(hexToBytes(hex));
  return tx.toBytes(true, false);
}

export async function fetchTx(txid: string, client: ElectrumClient) {
  const tx = await client.blockchain_transaction_get(txid, true);
  return tx;
}

export async function getTxPending(txid: string) {
  return withElectrumClient(async (client) => {
    const tx = await fetchTx(txid, client);
    return tx;
  });
}

export async function getTxData(txid: string) {
  return withElectrumClient(async (electrumClient) => {
    const tx = await electrumClient.blockchain_transaction_get(txid, true);
    if (typeof tx.confirmations === "undefined" || tx.confirmations < 1) {
      throw new Error("Tx is not confirmed");
    }

    const burnHeight = await confirmationsToHeight(tx.confirmations);
    const { header, stacksHeight, prevBlocks } = await findStacksBlockAtHeight(
      burnHeight,
      [],
      electrumClient
    );

    const merkle = await electrumClient.blockchain_transaction_getMerkle(
      txid,
      burnHeight
    );
    const hashes = merkle.merkle.map((hash: any) => {
      return reverseBuffer(hexToBytes(hash));
    });

    const blockArg = {
      header: hexToBytes(header),
      height: stacksHeight,
    };

    const txHex = getTxHex(tx.hex);

    const proofArg = {
      hashes: hashes,
      txIndex: merkle.pos,
      treeDepth: hashes.length,
    };

    // return {
    //   txHex: txHex,
    //   proof: proofArg,
    //   block: blockArg,
    //   prevBlocks: prevBlocks.map((b) => hexToBytes(b)),
    //   tx,
    //   burnHeight
    // };

    return {
      burnHeight: burnHeight,
      height: stacksHeight,
      tx: tx.hex,
      header: header,
      prevTxidVout: tx.vin.map((e: any) => { return { txid: e.txid, vout: e.vout } }),
      scriptPubKey: tx.vout.map((e: any) => e.scriptPubKey.hex),
      proof: { "tx-index": proofArg.txIndex, "hashes": proofArg.hashes.map((h) => bytesToHex(h)), "tree-depth": proofArg.treeDepth }
    }

  });
}

export async function confirmationsToHeight(confirmations: number) {
  const curHeight = Number(await getCurrentBurnBlock());
  const height = curHeight - confirmations + 1;
  return height;
}

if (require.main === module) {

  if (process.argv.length < 3) {
    console.log(
      `Usage: pnpm tsx scripts/extract-tx-data.ts "[txID]"`,
    );
    process.exit(0);
  }

  const [
    _runner,
    _binaryFilePath,
    txID
  ] = process.argv;

  //2e951004175cbc4a0a421efbb5a42aaa4e4708c1bc15a08ab03e41020336603b
  getTxData(txID).then((output) => { console.log(output) });
}
