import toml from '@iarna/toml';
import fs from 'fs';
import path from 'path';

const clarinetConfig = toml.parse(
  fs.readFileSync(path.resolve(__dirname, '../..', 'Clarinet.toml'), 'utf8'),
);

fs.writeFileSync(
  path.resolve(__dirname, './contracts.json'),
  JSON.stringify(clarinetConfig.contracts, null, 2) + '\n',
);
