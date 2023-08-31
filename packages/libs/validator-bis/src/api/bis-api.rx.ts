import { from } from 'rxjs';
import { getActivityOnBlock, getBalanceOnBlock } from './bis-api';

export function getActivityOnBlock$(block: number) {
  return from(getActivityOnBlock(block));
}

export function getBalanceOnBlock$(address: string, block: number) {
  return from(getBalanceOnBlock(address, block));
}
