/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBitcoinData$ } from './get-bitcoin.rx';

describe('libs-bitcoin', () => {
  it('should get bitcoin data', done => {
    const results: any[] = [];
    getBitcoinData$([
      '6d5ba7f257f634ee7ec3220263dc3c5c6df13e6d5f3f61957250ceed1c43666a',
    ]).subscribe({
      next: result => {
        results.push(result);
      },
      complete: () => {
        expect(results).toMatchInlineSnapshot();
        done();
      },
    });
  });
});
