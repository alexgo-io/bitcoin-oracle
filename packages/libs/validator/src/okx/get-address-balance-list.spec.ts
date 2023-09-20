import { getAddressBalanceList } from './get-address-balance-list';

describe('get-address-balance-list', function () {
  it.skip('should get', async function () {
    const res = await getAddressBalanceList({
      address: 'bc1qxjukwsrrqsjlk9ftpfxc03heykakp9c2x2nghv',
    });

    expect(res).toBeDefined();
  });
});
