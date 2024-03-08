import {
  assertNever,
  getLogger,
  got,
  noAwait,
  parseErrorDetail,
  sleep,
  stringifyJSON,
} from '@meta-protocols-oracle/commons';
import {
  DeployContract,
  FeeCalculationFunc,
  Operation,
  PublicCall,
  TransferSTX,
} from '@meta-protocols-oracle/types';
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
  estimateTransactionFeeWithFallback,
  getAddressFromPrivateKey,
  hexToCV,
  makeContractCall,
  makeContractDeploy,
  makeSTXTokenTransfer,
} from '@stacks/transactions';
import assert from 'assert';
import * as fs from 'fs';
import fetch from 'node-fetch';
import PQueue from 'p-queue';
import { z } from 'zod';
import { alertToTelegram } from '../alert';
import { env } from '../env';

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

const multicastQueue = new PQueue({ concurrency: 1000 });

export const processOperations =
  (
    privateKey: string,
    options: {
      stacksAPIURL: string;
      puppetURL?: string;
      fee?: number;
      contractAddress?: string;
      chainID?: ChainID;
      didRBFBroadcast?: (params: {
        originalTxId: string;
        nonce: number;
        newTxId: string;
        fee?: number;
        broadcastResult: TxBroadcastResult;
      }) => Promise<void>;
      calculateFee?: FeeCalculationFunc;
    },
  ) =>
  async (operations: Operation[]) => {
    const kStacksMaxTxPerBlockPerAccount = env().STACKS_MAX_TX_PER_BLOCK;
    let currentMaxTxPerBlockPerAccount = kStacksMaxTxPerBlockPerAccount;

    const chainID = options.chainID ?? ChainID.Testnet;
    const transactionVersion = chainIDToTransactionVersion(chainID);
    const puppetUrl = options.puppetURL ?? '';
    const senderAddress = getAddressFromPrivateKey(
      privateKey,
      transactionVersion,
    );
    const contractAddress = options.contractAddress ?? senderAddress;
    const { stacksAPIURL, fee, calculateFee, didRBFBroadcast } = options;

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
            calculateFee,
            didRBFBroadcast,
          });
        }
      }

      getLogger('stacks-caller').debug(
        `[${ts()}] processing #${
          nonce - startingNonce
        }, nonce: ${nonce}, serverNonce: ${lastExecutedNonce}, perBlock: ${currentMaxTxPerBlockPerAccount}`,
      );

      let txFee;
      try {
        switch (operation.type) {
          case 'publicCall': {
            txFee = operation.options?.feeOverride ?? options.fee;
            if (txFee == null && env().STACKS_RBF_MODE === 'function') {
              assert(
                calculateFee,
                `calculateFee is not defined for function mode`,
              );

              const calculatedFee = await calculateFee({
                type: 'operation',
                operation,
              });

              if (calculatedFee == null) {
                throw new Error(
                  `calculateFee returned null for ${operation.contract}.${operation.function}`,
                );
              }

              txFee = calculatedFee;
            }
            if (txFee == null) {
              txFee = await estimateFee({
                network,
                contractAddress,
                operation,
                nonce,
                senderKey: privateKey,
              });
            }

            await publicCall(
              operation,
              {
                senderKey: privateKey,
                nonce,
                fee: txFee,
              },
              network,
              contractAddress,
            );
            break;
          }
          case 'deploy': {
            txFee = operation.options?.feeOverride ?? options.fee;
            if (txFee == null) {
              txFee = await estimateFee({
                network,
                contractAddress,
                operation,
                nonce,
                senderKey: privateKey,
              });
            }

            await deployContract(
              operation,
              {
                senderKey: privateKey,
                nonce,
                fee: txFee,
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
          }
          case 'transfer': {
            txFee = operation.options?.feeOverride ?? options.fee;
            if (txFee == null) {
              txFee = await estimateFee({
                network,
                contractAddress,
                operation,
                nonce,
                senderKey: privateKey,
              });
            }
            await transferSTX(
              operation,
              {
                senderKey: privateKey,
                nonce,
                fee: txFee,
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
          }
          default:
            assertNever(operation);
        }
        nonce++;
      } catch (e) {
        if ((e as Error).message.includes('ContractAlreadyExists')) {
          continue;
        }
        if ((e as Error).message.includes('ConflictingNonceInMempool')) {
          const strategy = env().STACKS_CONFLICTING_NONCE_STRATEGY;
          if (strategy === 'increase') {
            getLogger('stacks-caller').warn(
              `[${ts()}] ConflictingNonceInMempool, increase the nonce from ${nonce} to ${
                nonce + 1
              } and retrying..., per block: ${currentMaxTxPerBlockPerAccount}`,
            );
            nonce++;
          } else if (strategy === 'replace') {
            const rbfMode = env().STACKS_RBF_MODE;
            assert(
              rbfMode === 'off' || rbfMode === 'estimate',
              `RBF should be off or estimate when using replace strategy`,
            );
            assert(txFee, `txFee is not defined`);
            getLogger('stacks-caller').log(
              `[${ts()}] ConflictingNonceInMempool, increasing the fee from ${
                txFee / 1e6
              } to ${(txFee + 0.02e6) / 1e6} and retrying...`,
            );

            txFee =
              txFee +
              env().STACKS_CONFLICTING_NONCE_REPLACE_INCREMENT_STX * 1e6;

            operation.options = {
              ...operation.options,
              feeOverride: txFee,
            };
          } else {
            assertNever(strategy);
          }
          operations.unshift(operation);

          await RBFIfNeeded(senderAddress, nonce - 1, privateKey, {
            stacksAPIURL,
            chainID,
            contractAddress,
            didRBFBroadcast,
            calculateFee,
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
          }... truncated...
${parseErrorDetail(e)}`,
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
          calculateFee,
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
    calculateFee?: FeeCalculationFunc;
  },
) {
  const rbfMode = env().STACKS_RBF_MODE;
  if (rbfMode === 'off') {
    return;
  }

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
  const IntegerFees = z.array(z.number().int());

  let newFee: number | undefined;
  if (rbfMode === 'stages') {
    const feeLevels = IntegerFees.parse(
      env().STACKS_RBF_STAGES.map(x => x * 1e6),
    );
    newFee = feeLevels.find(x => x > fee);
    if (newFee == null) {
      if (maxFeeReachedNonce.includes(tx.nonce)) {
        return;
      }
      await alertToTelegram('RBF', 'Max fee reached', {
        tx_id: tx.tx_id,
        nonce: tx.nonce.toString(),
        fee: `${fee / 1e6}`,
      });
      getLogger('stacks-caller').warn(
        `${tx.nonce} already at MAX RBF rate of [${
          feeLevels[feeLevels.length - 1]! / 1e6
        }]}`,
      );
      maxFeeReachedNonce.push(tx.nonce);
      return;
    }
    getLogger('stacks-caller').log(
      `RBFIng[stages] tx ${tx.tx_id} : ${tx.nonce} from ${fee / 1e6} to ${
        newFee / 1e6
      }, after ${secondsPassed / 60} mins`,
    );
  } else if (rbfMode === 'estimate') {
    const feeThreshold = env().STACKS_RBF_ESTIMATE_THRESHOLD;
    const estimatedFee = await estimateFee({
      network,
      contractAddress,
      operation: {
        type: 'publicCall',
        contract: tx.contract_call.contract_id.split('.')[1]!,
        function: tx.contract_call.function_name,
        args: tx.contract_call.function_args!.map(x => hexToCV(x.hex)),
      },
      nonce: tx.nonce,
      senderKey,
    });
    if (estimatedFee - fee < feeThreshold) {
      return;
    }
    newFee = estimatedFee;
    getLogger('stacks-caller').log(
      `RBFIng[estimate] tx ${tx.tx_id} : ${tx.nonce} from ${fee / 1e6} to ${
        newFee / 1e6
      }, after ${secondsPassed / 60} mins`,
    );
  } else if (rbfMode === 'function') {
    if (!options.calculateFee) {
      throw new Error(`calculateRBFFee is not defined but rbfMode is function`);
    }

    const funcNewFee = await options.calculateFee({
      type: 'mempool',
      tx,
      currentFee: fee,
    });
    if (funcNewFee == null) {
      return;
    }

    if (funcNewFee <= fee) {
      return;
    }

    getLogger('stacks-caller').log(
      `RBFIng[function] tx ${tx.tx_id} : ${tx.nonce} from ${fee / 1e6} to ${
        funcNewFee / 1e6
      }, after ${secondsPassed / 60} mins`,
    );
    newFee = funcNewFee;
  } else {
    assertNever(rbfMode);
  }

  await publicCall(
    {
      type: 'publicCall',
      contract: tx.contract_call.contract_id.split('.')[1]!,
      function: tx.contract_call.function_name,
      args: tx.contract_call.function_args!.map(x => hexToCV(x.hex)),
      options: {
        onBroadcast: async (result, options_) => {
          await options.didRBFBroadcast?.({
            broadcastResult: result,
            newTxId: result.txid,
            originalTxId: tx.tx_id,
            nonce: tx.nonce,
            fee: options_.fee,
          });

          await alertToTelegram('RBF', 'Tx RBFed', {
            newTxId: result.txid,
            originalTxId: tx.tx_id,
            nonce: tx.nonce.toString(),
            fee: `${fee / 1e6} -> ${newFee! / 1e6}`,
          });
        },
      },
    },
    {
      nonce: tx.nonce,
      senderKey,
      fee: newFee,
    },
    network,
    contractAddress,
  );
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
  const fee = await estimateTransactionFeeWithFallback(
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
    fee: options.fee ?? 0.001e6,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    senderKey: options.senderKey,
    amount: operation.amount,
    recipient: operation.address,
  };
  const fee = await estimateTransactionFeeWithFallback(
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
  fee: number;
};

function capOrFloorFee(fee: number) {
  if (env().STACKS_TX_GAS_FLOOR > 25 || env().STACKS_TX_GAS_FLOOR > 25) {
    throw new Error(``);
  }
  const cap = env().STACKS_TX_GAS_CAP * 1e6;
  const floor = env().STACKS_TX_GAS_FLOOR * 1e6;

  return Math.floor(Math.max(Math.min(fee, cap), floor));
}

export async function estimateFee(options: {
  network: StacksNetwork;
  contractAddress: string;
  operation: Operation;
  nonce: number;
  senderKey: string;
}) {
  let fee;
  let cappedFee;
  if (options.operation.type === 'publicCall') {
    fee = Number(
      await estimateTransactionFeeWithFallback(
        await makeContractCall({
          network: options.network,
          contractAddress: options.contractAddress,
          contractName: options.operation.contract,
          functionName: options.operation.function,
          functionArgs: options.operation.args,
          nonce: options.nonce,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow,
          senderKey: options.senderKey,
        }),
        options.network,
      ),
    );
    cappedFee = capOrFloorFee(fee);
    if (cappedFee !== fee) {
      getLogger('fee-logger').warn(
        `Estimated Fee is capped: from: ${fee / 1e6} to ${cappedFee / 1e6}. ${
          options.operation.contract
        }.${options.operation.function}`,
      );
    }
  } else if (options.operation.type === 'deploy') {
    fee = Number(
      await estimateTransactionFeeWithFallback(
        await makeContractDeploy({
          contractName: options.operation.name,
          codeBody: fs.readFileSync(options.operation.path, 'utf8'),
          nonce: options.nonce,
          network: options.network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow,
          senderKey: options.senderKey,
        }),
        options.network,
      ),
    );

    cappedFee = capOrFloorFee(fee);
    if (cappedFee !== fee) {
      getLogger('fee-logger').warn(
        `Estimated Fee is capped: from: ${fee / 1e6} to ${cappedFee / 1e6}. ${
          options.operation.name
        }.deploy`,
      );
    }
  } else if (options.operation.type === 'transfer') {
    fee = Number(
      await estimateTransactionFeeWithFallback(
        await makeSTXTokenTransfer({
          network: options.network,
          nonce: options.nonce,
          anchorMode: AnchorMode.Any,
          senderKey: options.senderKey,
          amount: options.operation.amount,
          recipient: options.operation.address,
        }),
        options.network,
      ),
    );
    cappedFee = capOrFloorFee(fee);
    if (cappedFee !== fee) {
      getLogger('fee-logger').warn(
        `Estimated Fee is capped: from: ${fee / 1e6} to ${
          cappedFee / 1e6
        }. transfer`,
      );
    }
  } else {
    assertNever(options.operation);
  }

  return cappedFee;
}

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

  const transaction = await makeContractCall(txOptions);

  const result = await broadcastTransaction(transaction, network);
  if (env().STACKS_MULTI_CAST) {
    for (let i = 0; i < 5; i++) {
      const seed = Math.random();
      noAwait(
        multicastQueue.add(async () => {
          try {
            // sleep random time of 1-5 * i seconds
            await sleep((i + 1) * 1000 * (seed * 5));

            const result = await broadcastTransaction(transaction, network);
            if (result.error) {
              getLogger('stacks-caller').verbose(
                `[public call] multicast[${i}] result error: ${JSON.stringify(
                  result,
                )}`,
              );
              throw new Error(result.reason!);
            } else {
              getLogger('stacks-caller').verbose(
                `[public call] multicast[${i}] success: ${JSON.stringify(
                  result.txid,
                )}, nonce: ${options.nonce}`,
              );
            }
          } catch (e) {
            getLogger('stacks-caller').verbose(
              `[public call] multicast[${i}] exception: ${JSON.stringify(e)}`,
            );
          }
        }),
      );
    }
  }

  if (operation.options?.onBroadcast) {
    await operation.options.onBroadcast(result, {
      nonce: options.nonce,
      fee: txOptions.fee,
    });
  }

  if (result.error) {
    getLogger('stacks-caller').log(
      `[public call] broadcast failed: ${JSON.stringify(result)}`,
    );
    throw new Error(result.reason!);
  } else {
    getLogger('stacks-caller').log(
      `[public call] broadcast success: ${JSON.stringify(
        result.txid,
      )}, nonce: ${options.nonce}`,
    );
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
