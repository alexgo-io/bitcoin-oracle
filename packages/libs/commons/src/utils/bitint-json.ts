// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyJSON(obj: any, space = 0) {
  return JSON.stringify(
    obj,
    (_, v) => {
      if (typeof v === 'bigint') {
        return `${v}n`;
      }
      else if (v?.type == 'Buffer' && Array.isArray(v?.data)) {
        // Buffer.from('').toJSON(); is used to construct this object
        try {
          return '0x' + Buffer.from(v.data).toString('hex');
        } catch (e) {
          return v;
        }
      }
      else {
        return v;
      }
    },
    space,
  );
}

export function parseJSON(str: string) {
  return JSON.parse(str, (_, v) =>
    typeof v === 'string' && v.endsWith('n') ? BigInt(v.slice(0, -1)) : v,
  );
}
