import got from 'got-cjs';
import { uniq } from 'lodash';
import {
  DEPLOYER_ACCOUNT_ADDRESS,
  DEPLOYER_ACCOUNT_SECRETKEY,
  USER_ACCOUNTS,
} from './constants';
import { transferStxTo } from './contracts/operationFactory';
import { processOperations } from './utils/processOperations';

const processAsDeployer = processOperations(
  DEPLOYER_ACCOUNT_ADDRESS(),
  DEPLOYER_ACCOUNT_SECRETKEY(),
  1e6,
);

async function setup() {
  const list: { Address: string }[] = await got
    .get(
      'https://still-wave-a807-production.reily.workers.dev/v1/table/474f84ab0c8444ef84feae17dee513e8',
    )
    .json();
  const addresses = list.flatMap(({ Address }) => Address.split(','));

  await processAsDeployer([
    ...uniq([...USER_ACCOUNTS().map(u => u.address), ...addresses]).flatMap(
      address => [transferStxTo(address, 100e6)],
    ),
  ]);
}

setup()
  .catch(console.error)
  .then(() => process.exit());
