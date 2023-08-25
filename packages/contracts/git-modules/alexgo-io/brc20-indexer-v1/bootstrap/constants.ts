import config from './config.json';

export const DEPLOYER_ACCOUNT_ADDRESS = () => config.DEPLOYER_ACCOUNT_ADDRESS;
export const DEPLOYER_ACCOUNT_SECRETKEY = () =>
  config.DEPLOYER_ACCOUNT_SECRETKEY;
export const STACKS_API_URL = () =>
  process.env.STACKS_API_URL || config.STACKS_API_URL;
export const STACKS_PUPPET_URL = () =>
  process.env.STACKS_PUPPET_URL || config.STACKS_PUPPET_URL;
export const USER_ACCOUNTS = () => config.USER_ACCOUNTS;
