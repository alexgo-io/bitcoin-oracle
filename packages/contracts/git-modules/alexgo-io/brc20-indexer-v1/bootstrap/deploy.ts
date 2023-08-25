import path from 'path';
import {
  DEPLOYER_ACCOUNT_ADDRESS,
  DEPLOYER_ACCOUNT_SECRETKEY,
  STACKS_API_URL,
} from './constants';
import { Contracts } from './contracts/contractNames';
import { deployContracts } from './setup/deployContracts';
import { sleep } from './utils';
import { getAccountInfo, processOperations } from './utils/processOperations';

(async () => {
  while (true) {
    try {
      await getAccountInfo(DEPLOYER_ACCOUNT_ADDRESS());
      break;
    } catch (e) {
      console.log(
        `waiting for connecting stacks-node-api: ${STACKS_API_URL()}`,
      );
      await sleep(500);
    }
  }

  console.log(`starting deploy: ${STACKS_API_URL()}`);
  await processOperations(
    DEPLOYER_ACCOUNT_ADDRESS(),
    DEPLOYER_ACCOUNT_SECRETKEY(),
    10 * 1e6,
  )(deployContracts(Contracts, path.resolve(__dirname, '..')));
})();
