import { getTransactionList } from './get-transaction-list';

describe('get-transaction-list', function () {
  it.skip('should get transaction list', async function () {
    const res = await getTransactionList({});
    expect(res).toBeDefined();
  });

  it.skip('should get transaction list by block height', async function () {
    const res = await getTransactionList({ blockHeight: '801899' });
    expect(res).toBeDefined();
  });
});
