import { generateContracts } from 'clarity-codegen/lib/generate';
import * as path from 'path';
import { DEPLOYER_ACCOUNT_ADDRESS, STACKS_API_URL } from '../constants';
import { Contracts } from './contractNames';

(async function main() {
  await generateContracts(
    STACKS_API_URL(),
    DEPLOYER_ACCOUNT_ADDRESS(),
    Contracts,
    path.resolve(__dirname, './generated/'),
    'Brc20Indexer',
  );
})().catch(console.error);
