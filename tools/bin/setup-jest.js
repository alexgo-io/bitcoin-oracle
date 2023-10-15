const path = require('path');
require('dotenv').config({
  debug: false,
  override: true,
  path: path.resolve(__dirname, '../../.env'),
});

const DB_URL = process.env['NODE_DATABASE_URL'];
if (!DB_URL.includes('localhost')) {
  throw new Error('Test can only run against localhost database');
}
