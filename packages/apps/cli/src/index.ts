import * as dotenv from 'dotenv';
import { join } from 'node:path';

if (process.env['NX_WORKSPACE_ROOT'] != null) {
  dotenv.config({
    path: join(process.env['NX_WORKSPACE_ROOT'], '.env'),
    override: true,
  });
}
export { run } from '@oclif/core';
