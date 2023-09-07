import { from } from 'rxjs';
import { getBISQueue, getElectrumQueue } from '../queue';
import { getActivityOnBlock, getBalanceOnBlock } from './bis-api';

export function getActivityOnBlock$(block: number) {
  return from(getBISQueue().add(() => getActivityOnBlock(block)));
}

export function getBalanceOnBlock$(address: string, block: number) {
  return from(getElectrumQueue().add(() => getBalanceOnBlock(address, block)));
}
