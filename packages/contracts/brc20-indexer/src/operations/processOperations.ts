/* eslint-disable @typescript-eslint/no-explicit-any */
import { stringifyJSON } from '@alex-b20/commons';
import { StacksMainnet, StacksMocknet, StacksNetwork } from '@stacks/network';
import {
  AccountDataResponse,
  AddressNonces,
  AddressTransactionsListResponse,
  Transaction,
} from '@stacks/stacks-blockchain-api-types';
import {
  AnchorMode,
  ChainID,
  PostConditionMode,
  StacksTransaction,
  TransactionVersion,
  broadcastTransaction,
  estimateContractFunctionCall,
  getAddressFromPrivateKey,
  makeContractCall,
  makeContractDeploy,
  makeSTXTokenTransfer,
} from '@stacks/transactions';
import assert from 'assert';
import * as fs from 'fs';
import got from 'got-cjs';
import pino from 'pino';
import {
  DeployContract,
  Operation,
  PublicCall,
  TransferSTX,
} from './operation';
import { assertNever, sleep } from './utils';

const logger = pino();

function chainIDToTransactionVersion(chainID: ChainID) {
  if (chainID === ChainID.Mainnet) {
    return TransactionVersion.Mainnet;
  }
  if (chainID === ChainID.Testnet) {
    return TransactionVersion.Testnet;
  }
  throw new Error(`Unknown chain ID, ${chainID}`);
}

function stackNetworkFrom(chainId: ChainID, url: string) {
  if (chainId === ChainID.Mainnet) {
    return new StacksMainnet({ url });
  }
  if (chainId === ChainID.Testnet) {
    return new StacksMocknet({ url });
  }
  throw new Error(`Unknown chain ID, ${chainId}`);
}

export const processOperations =
  (
    privateKey: string,
    options: {
      stacksAPIURL: string;
      puppetURL?: string;
      fee?: number;
      minFee?: number;
      contractAddress?: string;
      chainID?: ChainID;
    },
  ) =>
  async (operations: Operation[]) => {
    const kStacksMaxTxPerBlockPerAccount = 18;
    const stacksAPIURL = options.stacksAPIURL;
    const chainID = options.chainID ?? ChainID.Testnet;
    const fee = options.fee ?? 0.031e6;
    const minFee = options.minFee;
    const transactionVersion = chainIDToTransactionVersion(chainID);
    const puppetUrl = options.puppetURL ?? '';
    const senderAddress = getAddressFromPrivateKey(
      privateKey,
      transactionVersion,
    );
    const contractAddress = options.contractAddress ?? senderAddress;
    const network = stackNetworkFrom(chainID, stacksAPIURL);
    logger.info(`network: ${JSON.stringify(network)}, ${senderAddress}`);

    const start = Date.now();
    const ts = () => `${start}+${(Date.now() - start) / 1e3}s`;
    logger.info(
      `Submitting ${operations.length} operations, puppetURL: ${puppetUrl ?? ''}`,
    );
    const startingNonce = await getAccountNonceV2(stacksAPIURL, senderAddress);
    logger.info(`[${ts()}] starting nonce: ${startingNonce}`);
    if (operations.length === 0) return startingNonce;
    let lastExecutedNonce = await getAccountNonceV2(
      stacksAPIURL,
      senderAddress,
    );
    let nonce = startingNonce;

    operations = operations.slice();
    let operation: undefined | Operation;

    while ((operation = operations.shift())) {
      while (nonce > lastExecutedNonce + kStacksMaxTxPerBlockPerAccount) {
        if (puppetUrl.length > 0) {
          await got(`${puppetUrl}/kick`, { method: 'POST' });
          await sleep(30);
        } else {
          await sleep(3 * 1000);
        }
        logger.debug(
          `0.waiting for server nonce to catch up... nonce: ${nonce} - serverNonce: ${lastExecutedNonce}`,
        );
        lastExecutedNonce = await getAccountNonceV2(
          stacksAPIURL,
          senderAddress,
        );
      }

      logger.debug(
        `[${ts()}] processing #${
          nonce - startingNonce
        }, nonce: ${nonce}, serverNonce: ${lastExecutedNonce}, perBlock: ${kStacksMaxTxPerBlockPerAccount}`,
      );

      try {
        switch (operation.type) {
          case 'publicCall':
            await publicCall(
              operation,
              { senderKey: privateKey, nonce, fee, minFee },
              network,
              contractAddress,
            ).then(result =>
              operation?.onBroadcast?.(result).catch(e => {
                logger.error(`operation.onBroadcast failed: ${e.message}`, e);
                return null;
              }),
            );
            break;
          case 'deploy':
            await deployContract(
              operation,
              { senderKey: privateKey, nonce, fee },
              network,
            ).then(result =>
              operation?.onBroadcast?.(result).catch(e => {
                logger.error(`operation.onBroadcast failed: ${e.message}`, e);
                return null;
              }),
            );
            break;
          case 'transfer':
            await transferSTX(
              operation,
              { senderKey: privateKey, nonce, fee },
              network,
            ).then(result =>
              operation?.onBroadcast?.(result).catch(e => {
                logger.error(`operation.onBroadcast failed: ${e.message}`, e);
                return null;
              }),
            );
            break;
          default:
            assertNever(operation);
        }
        nonce++;
      } catch (e) {
        if ((e as Error).message.includes('ContractAlreadyExists')) {
          continue;
        }
        if ((e as Error).message.includes('ConflictingNonceInMempool')) {
          logger.warn(
            `[${ts()}] ConflictingNonceInMempool, increase the nonce and retrying...`,
          );
          nonce++;
          operations.unshift(operation);
        }

        logger.warn(
          `[${ts()}] operation failed:,
          operation: ${stringifyJSON(operation)},
          error: ${e}`,
        );
      }
    }

    logger.debug(
      `[${ts()}] waiting for last executed nonce to catch up...${nonce} > ${lastExecutedNonce}`,
    );
    while (nonce > lastExecutedNonce) {
      if (puppetUrl.length > 0) {
        await got(`${puppetUrl}/kick`, { method: 'POST' });
        await sleep(100);
      } else {
        logger.trace(
          `1.[${ts()}] waiting for last executed nonce to catch up...${nonce} > ${lastExecutedNonce}`,
        );
        await sleep(3 * 1000);
      }
      lastExecutedNonce = await getAccountNonceV2(stacksAPIURL, senderAddress);
    }

    logger.debug(
      `[${ts()}] server nonce has caught up. nonce: ${nonce}, serverNonce: ${lastExecutedNonce}`,
    );

    if (nonce > startingNonce) {
      const txs = await getTransaction(
        stacksAPIURL,
        senderAddress,
        startingNonce,
      );
      const errTxs = txs.filter(tx => tx.tx_status !== 'success');
      if (errTxs.length) {
        logger.error(
          `[${ts()}] failed transactions: ${JSON.stringify(errTxs, null, 2)}`,
        );
        throw new Error(
          `[${ts()}] ${errTxs.length} transactions failed: ${errTxs.map(
            a => a.tx_id,
          )}`,
        );
      }
    }
    logger.info(
      `Finished ${nonce - startingNonce} transactions in ${
        Date.now() - start
      }ms. serverNonce is: ${lastExecutedNonce}, nonce is: ${nonce}, startingNonce: ${startingNonce}`,
    );
    return nonce;
  };

function hashCode(str: string) {
  let hash = 0,
    i = 0;
  const len = str.length;
  while (i < len) {
    hash = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
  }
  return hash + 2147483647 + 1;
  // return hash;
}

// Replace all ERR- for debug purposes
const codeMap: {
  [code: string]: {
    code: string;
    comment: string;
  };
} = {};

function processError(name: string, input: string) {
  const lines = input.split('\n');
  const result = lines
    .map((line, index) => {
      if (line.includes('define-constant')) {
        return line;
      }
      if (!line.includes('ERR-')) {
        return line;
      }
      const location = `${name}.clar:${index + 1}`;
      const code = hashCode(location).toString();
      const searchValue = /ERR-[A-Z-]+/g;
      codeMap[code] = {
        code: line.match(searchValue)?.join(',') ?? 'UNKNOWN_CODE',
        comment: location,
      };
      return line.replaceAll(searchValue, `(err u${code})`); //?
    })
    .filter(x => Boolean(x) && !x.startsWith(';;'))
    .join('\n');
  fs.writeFileSync('./codeMap.json', JSON.stringify(codeMap, null, 2) + '\n', {
    encoding: 'utf-8',
  });
  return result;
}

async function deployContract(
  operation: DeployContract,
  options: OperationOptions,
  network: StacksNetwork,
) {
  const txOptions = {
    contractName: operation.name,
    codeBody: processError(
      operation.name,
      fs.readFileSync(operation.path, 'utf8'),
    ),
    nonce: options.nonce,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    senderKey: options.senderKey,
    fee: options.fee,
  };
  const fee = await estimateContractFunctionCall(
    await makeContractDeploy(txOptions),
    network,
  ).catch(() => options.fee);
  const result = await broadcastTransaction(
    await makeContractDeploy({
      ...txOptions,
      fee,
    }),
    network,
  );
  if (result.error) {
    throw new Error(result.reason!);
  }
  return result;
}

async function transferSTX(
  operation: TransferSTX,
  options: OperationOptions,
  network: StacksNetwork,
) {
  const txOptions = {
    network,
    nonce: options.nonce,
    fee: options.fee,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    senderKey: options.senderKey,
    amount: operation.amount,
    recipient: operation.address,
  };
  const fee = await estimateContractFunctionCall(
    await makeSTXTokenTransfer(txOptions),
    network,
  ).catch(() => options.fee);
  const result = await broadcastTransaction(
    await makeSTXTokenTransfer({
      ...txOptions,
      fee,
    }),
    network,
  );
  if (result.error) {
    throw new Error(result.reason!);
  }
  return result;
}

type OperationOptions = {
  senderKey: string;
  nonce: number;
  fee?: number;
  minFee?: number;
};

async function publicCall(
  operation: PublicCall,
  options: OperationOptions,
  network: StacksNetwork,
  contractAddress: string,
) {
  const txOptions = {
    network,
    contractAddress,
    contractName: operation.contract,
    functionName: operation.function,
    functionArgs: operation.args,
    nonce: options.nonce,
    fee: options.fee,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    senderKey: options.senderKey,
  };
  let fee =
    options.fee ??
    (await estimateContractFunctionCall(
      await makeContractCall(txOptions),
      network,
    )
      .then(fee => Number(fee))
      .catch(() => 0.003e6)) ??
    0;

  if (options.minFee && fee < options.minFee) {
    fee = options.minFee;
  }

  const transaction = await makeContractCall({
    ...txOptions,
    fee,
  });

  const result = await broadcastTransactionWithRetryChaining(
    transaction,
    network,
  );

  if (result.error) {
    logger.info(`[public call] failed: ${JSON.stringify(result)}`);
    throw new Error(result.reason!);
  }

  return result;
}

async function broadcastTransactionWithRetryChaining(
  transaction: StacksTransaction,
  network: StacksNetwork,
) {
  let result;
  for (let i = 0; i < 20; i++) {
    result = await broadcastTransaction(transaction, network);
    if ((result.reason as any) === 'TooMuchChaining') {
      logger.warn(
        `[TooMuchChaining] retrying - ${i}... ${JSON.stringify(result)}`,
      );
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      return result;
    }
  }

  assert(result, `Failed to broadcast transaction: ${transaction.txid()}`);

  return result;
}

export async function getAccountInfo(
  stacksAPIURL: string,
  address: string,
): Promise<AccountDataResponse> {
  const url = `${stacksAPIURL}/v2/accounts/${address}?proof=0`;
  return got(url).json();
}

export async function getAccountNonceV2(
  stacksAPIURL: string,
  address: string,
): Promise<number> {
  return (await getAccountInfo(stacksAPIURL, address)).nonce;
}

async function getTransaction(
  stacksAPIURL: string,
  address: string,
  untilNonce: number,
) {
  const result: Transaction[] = [];
  while (result.every(t => t.nonce > untilNonce)) {
    const response: AddressTransactionsListResponse = await fetch(
      `${stacksAPIURL}/extended/v1/address/${address}/transactions?limit=50&offset=${result.length}`,
    ).then(r => r.json() as any);
    const newResults = response.results as any[];
    if (!newResults.length) {
      break;
    }
    result.push(...newResults);
  }
  return result.filter(a => a.nonce >= untilNonce);
}

export async function _getAccountNonce(
  apiURL: string,
  address: string,
): Promise<AddressNonces> {
  const url = `${apiURL}/extended/v1/address/${address}/nonces`;
  return got(url).json();
}
