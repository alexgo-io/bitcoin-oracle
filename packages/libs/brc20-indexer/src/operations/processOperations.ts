import { getLogger, stringifyJSON } from '@meta-protocols-oracle/commons';
import { StacksMainnet, StacksMocknet, StacksNetwork } from '@stacks/network';
import {
  AccountDataResponse,
  AddressTransactionsListResponse,
  MempoolTransaction,
  Transaction,
} from '@stacks/stacks-blockchain-api-types';
import {
  AnchorMode,
  ChainID,
  PostConditionMode,
  TransactionVersion,
  TxBroadcastResult,
  broadcastTransaction,
  estimateContractFunctionCall,
  getAddressFromPrivateKey,
  hexToCV,
  makeContractCall,
  makeContractDeploy,
  makeSTXTokenTransfer,
} from '@stacks/transactions';
import * as fs from 'fs';
import got from 'got-cjs';
import fetch from 'node-fetch';
import { alertToTelegram } from '../alert';
import {
  DeployContract,
  Operation,
  PublicCall,
  TransferSTX,
} from './operation';
import { assertNever, sleep } from './utils';

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
      feeMultiplier?: number;
      contractAddress?: string;
      chainID?: ChainID;
      didRBFBroadcast?: (params: {
        originalTxId: string;
        nonce: number;
        newTxId: string;
        fee?: number;
        broadcastResult: TxBroadcastResult;
      }) => Promise<void>;
    },
  ) =>
  async (operations: Operation[]) => {
    const kStacksMaxTxPerBlockPerAccount = 18;
    let currentMaxTxPerBlockPerAccount = kStacksMaxTxPerBlockPerAccount;
    const stacksAPIURL = options.stacksAPIURL;
    const chainID = options.chainID ?? ChainID.Testnet;
    const fee = options.fee;
    const transactionVersion = chainIDToTransactionVersion(chainID);
    const puppetUrl = options.puppetURL ?? '';
    const senderAddress = getAddressFromPrivateKey(
      privateKey,
      transactionVersion,
    );
    const didRBFBroadcast = options.didRBFBroadcast;
    const contractAddress = options.contractAddress ?? senderAddress;
    const network = stackNetworkFrom(chainID, stacksAPIURL);
    getLogger('stacks-caller').log(
      `network: ${JSON.stringify(network)}, ${senderAddress}`,
    );

    const start = Date.now();
    const ts = () => `${start}+${(Date.now() - start) / 1e3}s`;
    getLogger('stacks-caller').log(
      `Submitting ${operations.length} operations, puppetURL: ${
        puppetUrl ?? ''
      }`,
    );
    const startingNonce = await getAccountNonceV2(stacksAPIURL, senderAddress);
    getLogger('stacks-caller').log(
      `[${ts()}] starting nonce: ${startingNonce}`,
    );
    if (operations.length === 0) return startingNonce;
    let lastExecutedNonce = await getAccountNonceV2(
      stacksAPIURL,
      senderAddress,
    );
    let nonce = startingNonce;

    operations = operations.slice();
    let operation: undefined | Operation;

    while ((operation = operations.shift())) {
      while (nonce > lastExecutedNonce + currentMaxTxPerBlockPerAccount) {
        if (puppetUrl.length > 0) {
          await got(`${puppetUrl}/kick`, { method: 'POST' });
          await sleep(30);
        } else {
          await sleep(30 * 1000);
        }
        getLogger('stacks-caller').debug(
          `0.waiting for server nonce to catch up... nonce: ${nonce} - serverNonce: ${lastExecutedNonce}`,
        );
        lastExecutedNonce = await getAccountNonceV2(
          stacksAPIURL,
          senderAddress,
        );

        if (nonce > lastExecutedNonce + currentMaxTxPerBlockPerAccount) {
          await RBFIfNeeded(senderAddress, lastExecutedNonce, privateKey, {
            stacksAPIURL,
            chainID,
            contractAddress,
            didRBFBroadcast,
          });
        }
      }

      getLogger('stacks-caller').debug(
        `[${ts()}] processing #${
          nonce - startingNonce
        }, nonce: ${nonce}, serverNonce: ${lastExecutedNonce}, perBlock: ${currentMaxTxPerBlockPerAccount}`,
      );

      try {
        switch (operation.type) {
          case 'publicCall':
            await publicCall(
              operation,
              {
                senderKey: privateKey,
                nonce,
                fee,
                feeMultiplier: options.feeMultiplier,
              },
              network,
              contractAddress,
            ).then(result => {
              getLogger('stacks-caller').log(
                `[public call] broadcast: ${JSON.stringify(
                  result.txid,
                )}, nonce: ${nonce}`,
              );

              return operation?.options
                ?.onBroadcast?.(result, { fee, nonce })
                .catch(e => {
                  getLogger('stacks-caller').error(
                    `operation.onBroadcast failed: ${e.message}`,
                    e,
                  );
                  return null;
                });
            });

            break;
          case 'deploy':
            await deployContract(
              operation,
              {
                senderKey: privateKey,
                nonce,
                fee,
                feeMultiplier: options.feeMultiplier,
              },
              network,
            ).then(result =>
              operation?.options
                ?.onBroadcast?.(result, { fee, nonce })
                .catch(e => {
                  getLogger('stacks-caller').error(
                    `operation.onBroadcast failed: ${e.message}`,
                    e,
                  );
                  return null;
                }),
            );
            break;
          case 'transfer':
            await transferSTX(
              operation,
              {
                senderKey: privateKey,
                nonce,
                fee,
                feeMultiplier: options.feeMultiplier,
              },
              network,
            ).then(result =>
              operation?.options
                ?.onBroadcast?.(result, { fee, nonce })
                .catch(e => {
                  getLogger('stacks-caller').error(
                    `operation.onBroadcast failed: ${e.message}`,
                    e,
                  );
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
          getLogger('stacks-caller').warn(
            `[${ts()}] ConflictingNonceInMempool, increase the nonce from ${nonce} to ${
              nonce + 1
            } and retrying..., per block: ${currentMaxTxPerBlockPerAccount}`,
          );
          nonce++;
          operations.unshift(operation);

          await RBFIfNeeded(senderAddress, nonce - 1, privateKey, {
            stacksAPIURL,
            chainID,
            contractAddress,
            didRBFBroadcast,
          });
          continue;
        }
        if ((e as Error).message === 'TooMuchChaining') {
          getLogger('stacks-caller').log(
            `[${ts()}] TooMuchChaining on nonce: ${nonce}, decreasing the max per block to ${
              currentMaxTxPerBlockPerAccount - 1
            }`,
          );
          operations.unshift(operation);
          currentMaxTxPerBlockPerAccount--;
          continue;
        }

        const operationJSON = stringifyJSON(operation);

        getLogger('stacks-caller').warn(
          `[${ts()}] operation failed:,
          operation: ${
            operationJSON.length < 4096
              ? operationJSON
              : operationJSON.slice(0, 4096)
          }... truncated,
          error: ${e}`,
        );
      }
    }

    getLogger('stacks-caller').debug(
      `[${ts()}] waiting for last executed nonce to catch up...${nonce} > ${lastExecutedNonce}`,
    );
    while (nonce > lastExecutedNonce) {
      if (puppetUrl.length > 0) {
        await got(`${puppetUrl}/kick`, { method: 'POST' });
        await sleep(100);
      } else {
        getLogger('stacks-caller').verbose(
          `1.[${ts()}] waiting for last executed nonce to catch up...${nonce} > ${lastExecutedNonce}`,
        );
        await sleep(5 * 1000);
      }
      lastExecutedNonce = await getAccountNonceV2(stacksAPIURL, senderAddress);
      if (nonce > lastExecutedNonce) {
        await RBFIfNeeded(senderAddress, lastExecutedNonce, privateKey, {
          stacksAPIURL,
          chainID,
          contractAddress,
          didRBFBroadcast,
        });
      }

      currentMaxTxPerBlockPerAccount = kStacksMaxTxPerBlockPerAccount;
    }

    getLogger('stacks-caller').debug(
      `[${ts()}] server nonce has caught up. nonce: ${nonce}, serverNonce: ${lastExecutedNonce}`,
    );

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operations.map(a => a.options?.onSettled?.(a as any)).filter(Boolean),
    );

    if (nonce > startingNonce) {
      const txs = await getTransaction(
        stacksAPIURL,
        senderAddress,
        startingNonce,
      );
      const errTxs = txs.filter(tx => tx.tx_status !== 'success');
      if (errTxs.length) {
        getLogger('stacks-caller').error(
          `[${ts()}] failed transactions: ${JSON.stringify(errTxs, null, 2)}`,
        );
        throw new Error(
          `[${ts()}] ${errTxs.length} transactions failed: ${errTxs.map(
            a => a.tx_id,
          )}`,
        );
      }
    }
    getLogger('stacks-caller').log(
      `Finished ${nonce - startingNonce} transactions in ${
        Date.now() - start
      }ms. serverNonce is: ${lastExecutedNonce}, nonce is: ${nonce}, startingNonce: ${startingNonce}`,
    );
    return nonce;
  };

const maxFeeReachedNonce: number[] = [];

const RBF_DURATION_IN_SECONDS = () => 30 * 60; // 30 mins
export async function fetchMemPoolTransactions(
  address: string,
  options: {
    stacksAPIURL: string;
  },
): Promise<MempoolTransaction[]> {
  const response = await fetch(
    `${options.stacksAPIURL}/extended/v1/address/${address}/mempool?limit=50`,
  ).then(r => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (response as any).results;
}

export async function RBFIfNeeded(
  address: string,
  serverNonce: number,
  senderKey: string,
  options: {
    stacksAPIURL: string;
    chainID?: ChainID;
    contractAddress: string;
    didRBFBroadcast?: (params: {
      originalTxId: string;
      nonce: number;
      newTxId: string;
      fee?: number;
      broadcastResult: TxBroadcastResult;
    }) => Promise<void>;
  },
) {
  const chainID = options.chainID ?? ChainID.Testnet;
  const contractAddress = options.contractAddress;
  const network = stackNetworkFrom(chainID, options.stacksAPIURL);
  // get tx from mem pool
  const memPoolTxs = await fetchMemPoolTransactions(address, options);
  const tx = memPoolTxs.find(x => x.nonce == serverNonce);
  if (tx == null || tx.tx_type !== 'contract_call') {
    return;
  }
  const secondsPassed = new Date().getTime() / 1000 - tx.receipt_time;
  if (secondsPassed < RBF_DURATION_IN_SECONDS()) {
    return;
  }
  const fee = Number(tx.fee_rate);
  const feeLevels = [0.08, 0.12, 0.24, 0.48].map(x => x * 1e6);
  const newFee = feeLevels.find(x => x > fee);
  if (!newFee) {
    if (maxFeeReachedNonce.includes(tx.nonce)) {
      return;
    }
    await alertToTelegram('RBF', 'Max fee reached', {
      tx_id: tx.tx_id,
      nonce: tx.nonce.toString(),
    });
    getLogger('stacks-caller').warn(
      `${tx.nonce} already at MAX RBF rate of [${
        feeLevels[feeLevels.length - 1] / 1e6
      }]}`,
    );
    maxFeeReachedNonce.push(tx.nonce);
    return;
  }
  getLogger('stacks-caller').log(
    `RBFIng tx ${tx.tx_id} : ${tx.nonce} from ${fee / 1e6} to ${
      newFee / 1e6
    }, after ${secondsPassed / 60} mins`,
  );

  await publicCall(
    {
      type: 'publicCall',
      contract: tx.contract_call.contract_id.split('.')[1],
      function: tx.contract_call.function_name,
      args: tx.contract_call.function_args!.map(x => hexToCV(x.hex)),
      options: {
        fee: newFee,
        onBroadcast: async (result, options_) => {
          await options.didRBFBroadcast?.({
            broadcastResult: result,
            newTxId: result.txid,
            originalTxId: tx.tx_id,
            nonce: tx.nonce,
            fee: options_.fee,
          });
        },
      },
    },
    {
      nonce: tx.nonce,
      senderKey,
    },
    network,
    contractAddress,
  );
  await alertToTelegram('RBF', 'Tx RBFed', {
    tx_id: tx.tx_id,
    nonce: tx.nonce.toString(),
  });
}

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
  feeMultiplier?: number;
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

  txOptions.fee = operation.options?.fee ?? options.fee;

  if (txOptions.fee == null) {
    delete txOptions['fee'];
    const estimatedFee = await estimateContractFunctionCall(
      await makeContractCall(txOptions),
      network,
    ).catch(() => BigInt(0.004e6));

    txOptions.fee = Number(estimatedFee) * (options.feeMultiplier ?? 1);
  }

  const transaction = await makeContractCall(txOptions);

  const result = await broadcastTransaction(transaction, network);

  if (result.error) {
    getLogger('stacks-caller').log(
      `[public call] failed: ${JSON.stringify(result)}`,
    );
    throw new Error(result.reason!);
  }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).then(r => r.json() as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newResults = response.results as any[];
    if (!newResults.length) {
      break;
    }
    result.push(...newResults);
  }
  return result.filter(a => a.nonce >= untilNonce);
}
