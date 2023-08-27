import { getActivityOnBlock, getBalanceOnBlock } from './bis-api';

describe('BiS API', function () {
  it('should get activity', async function () {
    const data = await getActivityOnBlock(802396);
    expect(data).toBeDefined();
  });

  // it('should get activity in batch', async function () {
  //   const queue = new PQueue({ concurrency: 10 });
  //   for (let i = 802396; i < 802398; i++) {
  //     queue.add(async () => {
  //       console.log(`getting: ${i}`);
  //       const data = await getActivityOnBlock(i);
  //       expect(data).toBeDefined();
  //     });
  //   }
  //
  //   await queue.onIdle();
  // }, 1200e3);

  it('should get balance', async function () {
    const data = await getBalanceOnBlock(
      '0014870dba15d6b5a0563b6df472359a7ef75d21f26c',
      802396,
    );

    expect(data).toBeDefined();
  });
});
