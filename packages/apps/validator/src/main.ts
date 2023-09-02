import { debug } from '@alex-b20/commons';
import { processBlock$ } from '@alex-b20/validator-bis';

async function main() {
  // 5
  // TODO: 802397, 801722: 404
  processBlock$(802392).pipe(debug('validator')).subscribe();
}

main().catch(console.error);
