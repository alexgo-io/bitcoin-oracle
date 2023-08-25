import {
  DEPLOYER_ACCOUNT_ADDRESS,
  DEPLOYER_ACCOUNT_SECRETKEY,
} from './constants';
import { transferStxTo } from './contracts/operationFactory';
import { processOperations } from './utils/processOperations';

const processAsDeployer = processOperations(
  DEPLOYER_ACCOUNT_ADDRESS(),
  DEPLOYER_ACCOUNT_SECRETKEY(),
  1e6,
);

async function faucet() {
  const recipient = process.argv[2];
  if (recipient == null) {
    console.log(`Usage: yarn faucet <address>`);
    return;
  }
  if (!recipient.startsWith('ST') && !recipient.startsWith('SP')) {
    console.log(`Invalid stacks address: ${recipient}`);
    return;
  }

  await processAsDeployer([transferStxTo(recipient, 100e6)]);
}

faucet().catch(console.error);
