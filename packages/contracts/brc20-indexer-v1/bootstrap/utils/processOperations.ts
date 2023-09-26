import { StacksMocknet } from '@stacks/network';
import {
  AccountDataResponse,
  AddressTransactionsListResponse,
  Transaction,
} from '@stacks/stacks-blockchain-api-types';
import {
  AnchorMode,
  broadcastTransaction,
  estimateContractFunctionCall,
  makeContractCall,
  makeContractDeploy,
  makeSTXTokenTransfer,
  PostConditionMode,
} from '@stacks/transactions';
import fs from 'fs';
import { assertNever, sleep } from '.';
import {
  DEPLOYER_ACCOUNT_ADDRESS,
  STACKS_API_URL,
  STACKS_PUPPET_URL,
} from '../constants';
import { Operation } from '../contracts/operation';

function jsonReplacer(this: any, key: string) {
  const v = this[key];
  if (typeof v === 'bigint') return String(v);
  return v;
}

export const processOperations =
  (address: string, senderKey: string, fee: number = 2 * 1e6) =>
  async (operations: Operation[]) => {
    const start = Date.now();
    const ts = () => `${start}+${Date.now() - start}`;
    console.log(`Submitting ${operations.length} operations`);
    let startingNonce = (await getAccountInfo(address)).nonce;
    console.log(`[${ts()}] starting nonce: ${startingNonce}`);
    if (operations.length === 0) return startingNonce;
    let serverNonce = startingNonce;
    let nonce = serverNonce;

    const puppetUrl = STACKS_PUPPET_URL() ?? '';

    operations = operations.slice();
    const nonceToOperation = new Map<number, Operation>();
    let operation: undefined | Operation;
    while ((operation = operations.shift())) {
      while (nonce > serverNonce + 25) {
        if (puppetUrl.length > 0) {
          await fetch(`${puppetUrl}/kick`, { method: 'POST' });
          await sleep(30);
        } else {
          await sleep(3 * 1000);
        }
        serverNonce = (await getAccountInfo(address)).nonce;
      }
      console.log(`[${ts()}] processing #${nonce - startingNonce}`);
      try {
        nonceToOperation.set(nonce, operation);
        switch (operation.type) {
          case 'publicCall':
            await publicCall(operation, { senderKey, nonce, fee });
            break;
          case 'deploy':
            await deployContract(operation, { senderKey, nonce, fee });
            break;
          case 'transfer':
            await transferSTX(operation, { senderKey, nonce, fee });
            break;
          default:
            assertNever(operation);
        }
        nonce++;
      } catch (e) {
        if ((e as Error).message.includes('ContractAlreadyExists')) {
          continue;
        }
        console.log(`[${ts()}] operation failed:`, operation, e);
      }
    }

    while (nonce !== serverNonce) {
      if (puppetUrl.length > 0) {
        await fetch(`${puppetUrl}/kick`, { method: 'POST' });
        await sleep(100);
      } else {
        await sleep(3 * 1000);
      }
      serverNonce = (await getAccountInfo(address)).nonce;
    }
    if (nonce > startingNonce) {
      const txs = await getTransaction(address, startingNonce);
      const errTxs = txs.filter(tx => tx.tx_status !== 'success');
      if (errTxs.length) {
        throw new Error(
          `[${ts()}] ${errTxs.length} transactions failed:\n\t${errTxs
            .map(
              a =>
                `tx: ${a.tx_id}\noperation: ${JSON.stringify(
                  nonceToOperation.get(a.nonce) ?? 'N/A',
                  jsonReplacer,
                )}, result: ${JSON.stringify(a.tx_result)}`,
            )
            .join('\n\t')}`,
        );
      }
    }
    console.log(
      `Finished ${nonce - startingNonce} transactions in ${
        Date.now() - start
      }ms`,
    );
    return nonce;
  };

const network = new StacksMocknet({ url: STACKS_API_URL() });

function hashCode(str: string) {
  let hash = 0,
    i = 0,
    len = str.length;
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
  operation: Operation.DeployContract,
  options: OperationOptions,
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
}

async function transferSTX(
  operation: Operation.TransferSTX,
  options: OperationOptions,
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
}

type OperationOptions = {
  senderKey: string;
  nonce: number;
  fee?: number;
};

async function publicCall(
  operation: Operation.PublicCall,
  options: OperationOptions,
) {
  const txOptions = {
    network,
    contractAddress: DEPLOYER_ACCOUNT_ADDRESS(),
    contractName: operation.contract,
    functionName: operation.function,
    functionArgs: operation.args,
    nonce: options.nonce,
    fee: options.fee,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    senderKey: options.senderKey,
  };
  const fee = await estimateContractFunctionCall(
    await makeContractCall(txOptions),
    network,
  ).catch(() => options.fee);
  const result = await broadcastTransaction(
    await makeContractCall({
      ...txOptions,
      fee,
    }),
    network,
  );
  if (result.error) {
    throw new Error(result.reason!);
  }
}

export async function getAccountInfo(
  address: string,
): Promise<AccountDataResponse> {
  const url = `${STACKS_API_URL()}/v2/accounts/${address}?proof=0`;
  const res = await fetch(url);
  return await res.json().catch(() => null);
}

async function getTransaction(address: string, untilNonce: number) {
  let result: Transaction[] = [];
  while (result.every(t => t.nonce > untilNonce)) {
    const response: AddressTransactionsListResponse = await fetch(
      `${STACKS_API_URL()}/extended/v1/address/${address}/transactions?limit=50&offset=${
        result.length
      }`,
    ).then(r => r.json());
    const newResults = response.results as any[];
    if (!newResults.length) {
      break;
    }
    result.push(...newResults);
  }
  return result.filter(a => a.nonce >= untilNonce);
}
