// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const noAwait = (_: Promise<any>) => {
  void _;
};
