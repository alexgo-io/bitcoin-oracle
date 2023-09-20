/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getHiroTxOnBlock$,
  getIndexerTxOnBlock$,
  processBlock$,
} from './validator';

jest.mock('@alex-b20/api-client', () => {
  return {
    indexer: () => {
      return {
        txs: () => {
          return {
            post: (tx: any) => {
              return tx;
            },
          };
        },
      };
    },
  };
});

describe('libs-validator-hiro', () => {
  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  it.skip('should getTxOnBlock', done => {
    const txs: { id: string }[] = [];
    getHiroTxOnBlock$(802396).subscribe({
      next: tx => {
        txs.push(tx as any);
      },
      complete: () => {
        expect(txs.sort((a, b) => Number(a.id) - Number(b.id)))
          .toMatchInlineSnapshot();
        done();
      },
    });
  }, 20e3);

  it.skip('should getIndexerTxOnBlock', done => {
    const txs: { id: string }[] = [];
    getIndexerTxOnBlock$(802396).subscribe({
      next: tx => {
        txs.push(tx as any);
      },
      complete: () => {
        expect(
          txs.sort((a, b) => Number(a.id) - Number(b.id)),
        ).toMatchInlineSnapshot();
        done();
      },
    });
  }, 30e3);

  it.skip('should processIndexerTxOnBlock', done => {
    const txs: any[] = [];
    processBlock$(802396).subscribe({
      next: val => {
        txs.push(val);
      },
      complete: () => {
        expect(txs).toMatchInlineSnapshot();
        done();
      },
    });
  }, 15e3);
});
